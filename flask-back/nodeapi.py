from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from scapy.all import ARP, Ether, srp
import psutil
import os
import json
import paramiko
import re
import subprocess
import time
import ipaddress
import netifaces
import logging
from collections import deque



# ------------------------------------------------ Validate License Start --------------------------------------------
# Function to decrypt a code (lookup MAC address, key, and key type)
def decrypt_code(code, lookup_table):
    return lookup_table.get(code, None)  # Return the entire record or None


# Load a JSON file and handle errors
def load_json_file(file_path):
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {file_path} file not found!")
    except json.JSONDecodeError:
        print(f"Error: Failed to decode {file_path}. Ensure it is a valid JSON.")
    return {}


# Check if the MAC address is available on the system
def is_mac_address_available(mac_address):
    try:
        result = subprocess.run(["ip", "link"], capture_output=True, text=True)
        return mac_address.lower() in result.stdout.lower()
    except Exception as e:
        print(f"Error checking MAC address: {e}")
        return False


# Function to remove specified files
def remove_files():
    files_to_remove = [
        "lookup_table.json",
        "perpetual_keys.json",
        "trial_keys.json",
        "yearly_keys.json",
        "triennial_keys.json",
    ]
    for file in files_to_remove:
        try:
            if os.path.exists(file):
                os.remove(file)
            # print(f"Removed: {file}")
            else:
                print(f"File not found: {file}")
        except Exception as e:
            print(f"Error removing file {file}: {e}")


# Function to export the license period based on the key type
def export_license_period(key_type):
    period = None
    if key_type == "trial":
        period = 15  # 15 days for trial
    elif key_type == "yearly":
        period = 365  # 365 days for yearly
    elif key_type == "triennial":
        period = 1095  # 1095 days for triennial
    elif key_type == "perpetual":
        period = "null"  # No export for perpetual, it's permanent

    return period


@app.route("/decrypt-code", methods=["POST"])
def decrypt_code_endpoint():

    encrypt_result = trigger_program()

    if not encrypt_result["success"]:
        return jsonify(encrypt_result), 500 
        
    data = request.get_json()

    if not data or "encrypted_code" not in data:
        return jsonify({"success": False, "message": "Encrypted code is required"}), 400

    encrypted_code = data["encrypted_code"]
    lookup_table = load_json_file("lookup_table.json")
    keys = load_json_file("key.json")

    # Get the CPU socket count
    socket_count_in = get_cpu_socket_count()
    if socket_count_in is None:
        return (
            jsonify(
                {"success": False, "message": "Unable to retrieve CPU socket count"}
            ),
            500,
        )

    # Attempt to decrypt the provided code
    decrypted_data = decrypt_code(encrypted_code, lookup_table)

    if decrypted_data is None:
        return (
            jsonify(
                {"success": False, "message": "Decryption failed, data mismatched!"}
            ),
            400,
        )

    mac_address = decrypted_data.get("mac_address")
    provided_key = decrypted_data.get("key")
    socket_count = decrypted_data.get("socket_count")
    license_type = decrypted_data.get(
        "licensePeriod"
    )  # Assuming `licensePeriod` contains the license type

    # Check if the MAC address is available on the system
    if not is_mac_address_available(mac_address):
        return (
            jsonify(
                {"success": False, "message": "MAC address not found on the system"}
            ),
            404,
        )

    if int(socket_count) != int(socket_count_in):
        return (
            jsonify({"success": False, "message": "Mismatching in Socket Count"}),
            400,
        )

    if not decrypted_data:
        return jsonify({"success": False, "message": "Code not found!"}), 404

    # Path to the license.txt file
    license_file_path = "/home/pinaka/Documents/GitHub/Pinaka-ZTi-v1.5/flask-back/license/license.txt"

    # Check if the license code already exists in the license.txt file
    if check_license_used(license_file_path, encrypted_code):
        return jsonify({"success": False, "message": "Code already used"}), 400

    # Verify the provided key against key.json and identify the key type
    key_type = next(
        (ktype for ktype, kvalue in keys.items() if kvalue == provided_key), None
    )

    if key_type:
        # Get the license period based on the key type
        license_period = export_license_period(key_type)

        remove_files()

        # Send response to frontend
        return jsonify(
            {
                "success": True,
                "mac_address": mac_address,
                "key_type": key_type,
                "license_period": license_period if license_period else "1",
                "socket_count": socket_count,
            }
        )
    else:
        return jsonify({"success": False, "message": "Invalid key provided"}), 404


# Helper function to check if the license code is already used
def check_license_used(file_path, license_code):
    try:
        if os.path.exists(file_path):
            with open(file_path, "r") as file:
                used_codes = file.readlines()
                return any(license_code.strip() == line.strip() for line in used_codes)
        return False
    except Exception as e:
        app.logger.error(f"Error checking license code in {file_path}: {e}")
        return False



# ------------------------------------------------ Validate License End --------------------------------------------


# ------------------------------------------------- Save and validate deploy config start----------------------------

@app.route("/submit-network-config", methods=["POST"])
def submit_network_config():
    try:
        data = request.get_json(force=True)

        print("✅ Received data:", json.dumps(data, indent=2))

        table_data = data.get("tableData", [])
        config_type = data.get("configType", "default")
        use_bond = data.get("useBond", False)

        provider = data.get("providerNetwork", {})
        tenant = data.get("tenantNetwork", {})

        disk = data.get("disk", [])
        if not isinstance(disk, list):
            disk = [disk] if disk else []

        vip = data.get("vip", "")
        default_gateway = data.get("defaultGateway", "")

        # === Top-level validation ===
        if not table_data:
            app.logger.error(f"Missing tableData: {data}")
            return jsonify({"success": False, "message": "tableData is required"}), 400

        if config_type not in ["default", "segregated"]:
            app.logger.error(f"Invalid configType: {config_type}")
            return jsonify({"success": False, "message": "Invalid configType"}), 400

        # === Validate each row in tableData ===
        for i, row in enumerate(table_data):
            interface = row.get("interface")
            if not interface:
                app.logger.error(f"Missing 'interface' in row {i+1}: {row}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"'interface' is required in row {i+1}",
                        }
                    ),
                    400,
                )

            if isinstance(interface, str):
                interface = [interface]

            for iface in interface:
                if not iface.strip():
                    app.logger.error(f"Empty interface name in row {i+1}: {row}")
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"Blank interface in row {i+1}",
                            }
                        ),
                        400,
                    )

                # Check if the interface is up
                if not is_interface_up(iface):
                    app.logger.error(f"Interface {iface} is down.")
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"Network interface '{iface}' is down. Please bring it up",
                            }
                        ),
                        400,
                    )

            # Only check bond name if bonding is used
            if use_bond and "bondName" in row:
                if not row["bondName"]:
                    app.logger.error(f"Empty bondName in row {i+1}")
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"'bondName' cannot be empty in row {i+1}",
                            }
                        ),
                        400,
                    )

            # Only check VLAN ID if provided (optional, not required)
            if "vlanId" in row and row["vlanId"] != "":
                try:
                    int(row["vlanId"])
                except ValueError:
                    app.logger.error(f"Invalid VLAN ID in row {i+1}: {row['vlanId']}")
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"VLAN ID must be an integer in row {i+1}",
                            }
                        ),
                        400,
                    )
            if row.get("ip") and not is_network_available(row["ip"]):
                app.logger.error(f"Unreachable interface IP in row {i+1}: {row['ip']}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"Interface IP {row['ip']} in row {i+1} is unreachable. Please check the network.",
                        }
                    ),
                    400,
                )


            if row.get("dns") and not is_ip_reachable(row["dns"]):
                app.logger.error(f"Unreachable DNS in row {i+1}: {row['dns']}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"DNS {row['dns']} in row {i+1} is unreachable (ping failed).",
                        }
                    ),
                    400,
                )

                # ✅ Validate VIP
        if vip:
            try:
                ipaddress.ip_address(vip)
            except ValueError:
                return jsonify({"success": False, "message": "Invalid VIP format"}), 400

            if not is_network_available(vip):
                return (
                    jsonify(
                        {"success": False, "message": "VIP network is not available"}
                    ),
                    400,
                )

            if is_ip_reachable(vip) or is_ip_assigned(vip):
                return (
                    jsonify({"success": False, "message": "VIP is already in use"}),
                    400,
                )

        # === Build output JSON ===
        response_json = {
            "using_interfaces": {},
            "disk": disk,
            "vip": vip,
            "default_gateway": default_gateway,  # Always include
            "hostname": data.get("hostname", "pinakasv")  # Always include
        }

        if default_gateway:
            if not is_network_available(default_gateway):
                app.logger.error(
                    f"Default gateway {default_gateway} is not available on local network"
                )
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"Default gateway {default_gateway} is not reachable from the host",
                        }
                    ),
                    400,
                )

        bond_count = 0
        iface_count = 1

        for row in table_data:
            row_type = row.get("type", [])
            if isinstance(row_type, str):
                row_type = [row_type]

            is_secondary = "Secondary" in row_type or row_type == ["secondary"]

            if use_bond and "bondName" in row and row["bondName"]:
                bond_key = f"bond{bond_count + 1}"
                response_json["using_interfaces"][bond_key] = {
                    "interface_name": row["bondName"],
                    "type": row_type,
                    "vlan_id": row.get("vlanId", "NULL") if row.get("vlanId") else "NULL",
                }

                if not is_secondary:
                    response_json["using_interfaces"][bond_key]["Properties"] = {
                        "IP_ADDRESS": row.get("ip", ""),
                        "Netmask": row.get("subnet", ""),
                        "DNS": row.get("dns", ""),
                        # No gateway field in table rows anymore
                    }

                for iface in row.get("interface", []):
                    iface_key = f"interface_0{iface_count}"
                    response_json["using_interfaces"][iface_key] = {
                        "interface_name": iface,
                        "Bond_Slave": "YES",
                        "Bond_Interface_Name": row["bondName"],
                    }
                    iface_count += 1

                bond_count += 1

            else:
                iface_key = f"interface_0{iface_count}"
                interface_name = (
                    row["interface"][0]
                    if isinstance(row["interface"], list)
                    else row["interface"]
                )
                interface_entry = {
                    "interface_name": interface_name,
                    "type": row_type,
                    "vlan_id": row.get("vlanId", "NULL") if row.get("vlanId") else "NULL",
                    "Bond_Slave": "NO",
                }

                if not is_secondary or config_type == "segregated":
                    interface_entry["Properties"] = {
                        "IP_ADDRESS": row.get("ip", ""),
                        "Netmask": row.get("subnet", ""),
                        "DNS": row.get("dns", ""),
                        # No gateway field in table rows anymore
                    }

                response_json["using_interfaces"][iface_key] = interface_entry
                iface_count += 1

        # === Save the file ===
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"network_config_{timestamp}.json"
        file_path = os.path.join("submitted_configs", filename)
        os.makedirs("submitted_configs", exist_ok=True)

        with open(file_path, "w") as f:
            json.dump(response_json, f, indent=4)

        return (
            jsonify({"success": True, "message": "Config saved", "filename": filename}),
            200,
        )

    except Exception as e:
        app.logger.error(f"❌ Exception occurred: {str(e)}")
        return jsonify({"success": False, "message": f"Bad Request: {str(e)}"}), 400


def is_interface_up(interface):
    """Check if the given network interface is up. If not, attempt to bring it up."""
    try:
        result = subprocess.run(
            ["ip", "link", "show", interface],
            stdout=subprocess.PIPE,
            universal_newlines=True,
        )

        if "state UP" in result.stdout:
            return True  # Interface is already up

        print(f"Interface {interface} is down. Attempting to bring it up...")

        subprocess.run(["sudo", "ip", "link", "set", interface, "up"], check=False)
        subprocess.run(["sudo", "systemctl", "restart", "networking"], check=False)
        time.sleep(10)

        result = subprocess.run(
            ["ip", "link", "show", interface],
            stdout=subprocess.PIPE,
            universal_newlines=True,
        )
        if "state UP" in result.stdout:
            return True

        print(f"Retrying with ifconfig for {interface}...")
        subprocess.run(["sudo", "ifconfig", interface, "up"], check=False)
        subprocess.run(["sudo", "systemctl", "restart", "networking"], check=False)
        time.sleep(10)

        result = subprocess.run(
            ["ip", "link", "show", interface],
            stdout=subprocess.PIPE,
            universal_newlines=True,
        )
        if "state UP" in result.stdout:
            return True

        print(f"Error: Interface {interface} is still down after multiple attempts.")
        return False

    except Exception as e:
        print(f"Error checking interface {interface}: {e}")
        return False


def is_network_available(ip):
    try:
        subnet = ".".join(ip.split(".")[:3])

        interfaces = psutil.net_if_addrs()
        network_available = False
        for interface, addresses in interfaces.items():
            for addr in addresses:
                if addr.family.name == "AF_INET":
                    local_subnet = ".".join(addr.address.split(".")[:3])
                    if local_subnet == subnet:
                        network_available = True
                        break
            if network_available:
                break

        if not network_available:
            print(f"Error: No network interface available in the subnet {subnet}.")
            return False

        active_hosts = []
        for i in range(1, 6):
            host_ip = f"{subnet}.{i}"
            result = subprocess.run(
                ["ping", "-c", "1", host_ip], capture_output=True, text=True
            )
            if result.returncode == 0:
                active_hosts.append(host_ip)

        return len(active_hosts) > 0
    except Exception as e:
        print(f"Error checking network availability: {e}")
        return False


def is_ip_reachable(dns_ip, count=1, timeout=2):
    """
    Ping a DNS server IP to check if it's reachable.

    Args:
        dns_ip (str): The DNS IP address to check.
        count (int): Number of ping packets to send.
        timeout (int): Timeout per ping attempt in seconds.

    Returns:
        bool: True if reachable, False otherwise.
    """
    try:
        result = subprocess.run(
            ["ping", "-c", str(count), "-W", str(timeout), dns_ip],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return result.returncode == 0
    except Exception as e:
        print(f"Error pinging DNS {dns_ip}: {e}")
        return False

# ------------------------------------------------- Save and validate deploy config end----------------------------

# ------------------------------------------------GET DISK LIST FROM THE RUNNING SERVER Start-----------------------


def get_root_disk():
    """Find the root disk name."""
    try:
        result = subprocess.run(
            ["lsblk", "-o", "NAME,MOUNTPOINT", "-J"], capture_output=True, text=True
        )
        data = json.loads(result.stdout)

        for disk in data.get("blockdevices", []):
            if "children" in disk:
                for part in disk["children"]:
                    if part.get("mountpoint") == "/":
                        return disk["name"]  # Root disk name (e.g., "sda")

        return None  # Return None if no root disk is found
    except Exception as e:
        return None


def get_disk_list():
    """Fetch disk list using lsblk and exclude the root disk."""
    try:
        # Get disk details including WWN
        result = subprocess.run(
            ["lsblk", "-o", "NAME,SIZE,WWN", "-J"], capture_output=True, text=True
        )
        disks = json.loads(result.stdout).get("blockdevices", [])

        # Get the root disk name
        root_disk = get_root_disk()

        # Filter out small-sized disks (KB, MB) and the root disk
        small_size_pattern = re.compile(r"\b(\d+(\.\d+)?)\s*(K|M)\b", re.IGNORECASE)
        filtered_disks = [
            {
                "name": disk["name"],
                "size": disk["size"],
                "wwn": disk.get("wwn", "N/A"),  # Some disks may not have WWN
            }
            for disk in disks
            if not small_size_pattern.search(disk["size"]) and disk["name"] != root_disk
        ]

        return filtered_disks
    except Exception as e:
        return str(e)


@app.route("/get-disks", methods=["GET"])
def get_disks():
    """API endpoint to get the list of available disks."""
    disks = get_disk_list()
    return jsonify({"disks": disks, "status": "success"})

# ------------------------------------------------GET DISK LIST FROM THE RUNNING SERVER End-----------------------

# ------------------------------------------------ local Interface list Start --------------------------------------------


@app.route("/get-interfaces", methods=["GET"])
def get_interfaces():
    # Initialize the interfaces list
    interfaces = []

    # Fetch network interface details
    net_info = psutil.net_if_addrs()

    # List of prefixes to exclude
    exclude_prefixes = (
        "docker",
        "lo",
        "ov",
        "br",
        "qg",
        "qr",
        "ta",
        "qv",
        "vxlan",
        "qbr",
        "qvo",
        "qvb",
        "q",
    )

    for iface, addrs in net_info.items():
        iface = (
            iface.strip().lower()
        )  # Strip spaces and convert to lowercase for case-insensitive comparison

        # Skip interfaces that start with any excluded prefix
        if iface.startswith(exclude_prefixes):
            continue

        mac = None
        ip = None
        is_physical = False

        # Check each address associated with the interface
        for addr in addrs:
            if addr.family.name == "AF_PACKET":  # MAC Address
                mac = addr.address
                is_physical = True  # Mark interface as physical if it has a MAC address
            elif addr.family.name == "AF_INET":  # IPv4 Address
                ip = addr.address

        # Only include physical interfaces (those with a MAC address)
        if (
            mac and is_physical
        ):  # Ensure that the interface is physical and has a MAC address
            interfaces.append({"iface": iface, "mac": mac, "ip": ip or "N/A"})

    # Fetch the number of CPU sockets (physical CPUs)
    cpu_sockets = get_cpu_socket_count()

    # Include the number of CPU sockets in the response
    response = {"interfaces": interfaces, "cpu_sockets": cpu_sockets}

    return jsonify(response)

# ------------------------------------------------ local Interface list End --------------------------------------------
