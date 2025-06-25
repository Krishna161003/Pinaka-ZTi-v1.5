from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import psutil
import os
import json
import paramiko
import re
import subprocess

app = Flask(__name__)
CORS(app)

# ------------------------------------------------ Server Validation Start --------------------------------------------
#  Validation criteria
ENV_REQUIREMENTS = {
    "development": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disks": 2,
        "network": 2,
    },
    "production": {
        "cpu_cores": 48,
        "memory_gb": 128,
        "disks": 4,
        "network": 2,
    },
}


# ---------- Local Validation ----------
def validate_local(env_type):
    requirements = ENV_REQUIREMENTS.get(env_type)
    if not requirements:
        return {"error": "Invalid environment type"}, 400

    cpu_cores = psutil.cpu_count(logical=False)
    memory_gb = round(psutil.virtual_memory().total / (1024**3))

    disk_partitions = psutil.disk_partitions()
    data_disks = [
        d
        for d in disk_partitions
        if not d.mountpoint.startswith("/boot") and "boot" not in d.device.lower()
    ]
    data_disks = [
        d
        for d in data_disks
        if psutil.disk_usage(d.mountpoint).total > 500 * 1024**3 and d.mountpoint != "/"
    ]

    net_ifaces = psutil.net_if_addrs()
    network_count = len([iface for iface in net_ifaces if iface != "lo"])

    validation = {
        "cpu": cpu_cores >= requirements["cpu_cores"],
        "memory": memory_gb >= requirements["memory_gb"],
        "disks": len(data_disks) >= requirements["disks"],
        "network": network_count >= requirements["network"],
    }

    result_status = "passed" if all(validation.values()) else "failed"

    result = {
        "cpu_cores": cpu_cores,
        "memory_gb": memory_gb,
        "data_disks": len(data_disks),
        "network_interfaces": network_count,
        "validation": validation,
        "validation_result": result_status,
    }
    return result, 200


# ---------- Remote SSH Validation ----------
def validate_remote(env_type, host, username, pem_path):
    requirements = ENV_REQUIREMENTS.get(env_type)
    if not requirements:
        return {"error": "Invalid environment type"}, 400

    try:
        key = paramiko.RSAKey.from_private_key_file(pem_path)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=host, username=username, pkey=key)

        commands = {
            "cpu": "nproc --all",
            "memory": "free -g | awk '/Mem:/ {print $2}'",
            "disks": 'BOOT_DISK=$(lsblk -no PKNAME $(findmnt -no SOURCE /boot/efi)); lsblk -nd -o NAME | grep -v "$BOOT_DISK" | wc -l',
            "network": 'ls -d /sys/class/net/* | grep -v lo | while read iface; do if [ -e "$iface/device" ]; then basename "$iface"; fi; done | wc -l',
        }

        results = {}
        for key, cmd in commands.items():
            stdin, stdout, stderr = ssh.exec_command(cmd)
            output = stdout.read().decode().strip()
            results[key] = int(re.findall(r"\d+", output)[0])

        ssh.close()

        validation = {
            "cpu": results["cpu"] >= requirements["cpu_cores"],
            "memory": results["memory"] >= requirements["memory_gb"],
            "disks": results["disks"] >= requirements["disks"],
            "network": results["network"] >= requirements["network"],
        }

        result_status = "passed" if all(validation.values()) else "failed"

        result = {
            "cpu_cores": results["cpu"],
            "memory_gb": results["memory"],
            "data_disks": results["disks"],
            "network_interfaces": results["network"],
            "validation": validation,
            "validation_result": result_status,
        }

        return result, 200

    except Exception as e:
        return {"error": str(e)}, 500


# ---------- API Endpoint ----------
@app.route("/validate", methods=["POST"])
def validate():
    data = request.json
    env_type = data.get("environment")
    mode = data.get("mode")

    if mode == "local":
        return jsonify(*validate_local(env_type))
    elif mode == "remote":
        host = data.get("host")
        username = "pinakasupport"
        pem_path = "./keypair/ps_key.pem"

        if not all([host, username, pem_path]):
            return jsonify({"error": "Missing remote credentials"}), 400

        return jsonify(*validate_remote(env_type, host, username, pem_path))
    else:
        return jsonify({"error": "Invalid mode (should be 'local' or 'remote')"}), 400


# ------------------------------------------------ Server Validation End --------------------------------------------

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


# Function to get the CPU socket count
def get_cpu_socket_count():
    try:
        if os.path.exists("/proc/cpuinfo"):
            with open("/proc/cpuinfo", "r") as cpuinfo:
                sockets = set()
                for line in cpuinfo:
                    if line.startswith("physical id"):
                        sockets.add(line.split(":")[1].strip())
                return len(sockets)
        else:
            print("This script is designed to work on Linux systems.")
            return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


# ------------------------------------------------ local Interface list End --------------------------------------------

# ------------------------------------------------ Encryption code run Start --------------------------------------------


@app.route("/trigger-program", methods=["POST"])
def trigger_program():
    try:
        # Extract any data sent with the request if needed
        data = request.get_json()
        if data["action"] == "runProgram":
            # Run the Python program (example with 'your_program.py')
            result = subprocess.run(
                ["sudo", "python3", "encrypt.py"],
                check=True,
                capture_output=True,
                text=True,
            )

            # If the program runs successfully, return a success response
            return jsonify({"success": True, "output": result.stdout})
        else:
            return jsonify({"success": False, "message": "Invalid action"})

    except Exception as e:
        # In case of any error, return an error message
        return jsonify({"success": False, "message": str(e)})


# ------------------------------------------------ Encryption code run End --------------------------------------------


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
    license_file_path = "/home/pinaka/license.txt"

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

        # Remove unnecessary files after processing
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


# Define the path where you want to store the data.json and license.txt files
DATA_DIRECTORY = "/home/pinaka/"  # Change this to the desired directory
LICENSE_FILE_PATH = "/home/pinaka/license.txt"  # Path for the license file


# Function to save data to a JSON file and license code to a license.txt file
def save_to_json_file(file_name, data):
    try:
        # Ensure the directory exists
        if not os.path.exists(DATA_DIRECTORY):
            os.makedirs(DATA_DIRECTORY)  # Create the directory if it doesn't exist

        # Define the full file path for the data.json file
        file_path = os.path.join(DATA_DIRECTORY, file_name)

        # Write data to the data.json file
        with open(file_path, "w") as file:
            json.dump(data, file, indent=4)

        # Extract the license code from the data
        license_code = data.get("licenseCode")

        # Check if the license code exists and write it to the license.txt file
        if license_code:
            # Open the license file in append mode ('a')
            with open(LICENSE_FILE_PATH, "a") as license_file:
                license_file.write(f"{license_code}\n")
            app.logger.info(f"License code saved to {LICENSE_FILE_PATH}")
        else:
            app.logger.error("License code not found in data")

        return True

    except Exception as e:
        app.logger.error(f"Error saving data to file: {e}")
        return False


# ------------------------------------------------ Validate License End --------------------------------------------


@app.route("/submit-network-config", methods=["POST"])
def submit_network_config():
    try:
        data = request.get_json(force=True)

        print("✅ Received data:", json.dumps(data, indent=2))

        table_data = data.get("tableData", [])
        config_type = data.get("configType", "default")
        use_bond = data.get("useBond", False)
        use_vlan = data.get("useVLAN", False)

        provider = data.get("providerNetwork", {})
        tenant = data.get("tenantNetwork", {})

        # Handle disk input (may be string or list)
        disk = data.get("disk", [])
        if not isinstance(disk, list):
            disk = [disk] if disk else []

        vip = data.get("vip", "")
        default_gateway = data.get("defaultGateway", "")

        # Error if tableData is empty
        if not table_data:
            return jsonify({"error": "Missing or empty tableData"}), 400

        response_json = {
            "using_interfaces": {},
            "provider_cidr": provider.get("cidr", "N/A"),
            "provider_gateway": provider.get("gateway", "N/A"),
            "provider_startingip": provider.get("startingIp", "N/A"),
            "provider_endingip": provider.get("endingIp", "N/A"),
            "tenant_cidr": tenant.get("cidr", "10.0.0.0/24"),
            "tenant_gateway": tenant.get("gateway", "10.0.0.1"),
            "tenant_nameserver": tenant.get("nameserver", "8.8.8.8"),
            "disk": disk,
            "vip": vip,
        }

        if config_type == "segregated":
            response_json["default_gateway"] = default_gateway

        bond_count = 0
        iface_count = 1

        for row in table_data:
            row_type = row.get("type", [])
            if isinstance(row_type, str):
                row_type = [row_type]

            is_secondary = "Secondary" in row_type or row_type == ["secondary"]

            # BOND group
            if use_bond and "bondName" in row and row["bondName"]:
                bond_key = f"bond{bond_count + 1}"
                response_json["using_interfaces"][bond_key] = {
                    "interface_name": row["bondName"],
                    "type": row_type,
                    "vlan_id": row.get("vlanId", "NULL") if use_vlan else "NULL",
                }

                if not is_secondary:
                    response_json["using_interfaces"][bond_key]["Properties"] = {
                        "IP_ADDRESS": row.get("ip", ""),
                        "Netmask": row.get("subnet", ""),
                        "DNS": row.get("dns", ""),
                        "gateway": row.get("gateway", ""),
                    }

                # Add slave interfaces
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
                # Non-bonded interface
                iface_key = f"interface_0{iface_count}"
                interface_name = (
                    row["interface"][0]
                    if isinstance(row["interface"], list)
                    else row["interface"]
                )
                interface_entry = {
                    "interface_name": interface_name,
                    "type": row_type,
                    "vlan_id": row.get("vlanId", "NULL") if use_vlan else "NULL",
                    "Bond_Slave": "NO",
                }

                if not is_secondary or config_type == "segregated":
                    interface_entry["Properties"] = {
                        "IP_ADDRESS": row.get("ip", ""),
                        "Netmask": row.get("subnet", ""),
                        "DNS": row.get("dns", ""),
                        "gateway": row.get("gateway", ""),
                    }

                response_json["using_interfaces"][iface_key] = interface_entry
                iface_count += 1

        # Save JSON to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"network_config_{timestamp}.json"
        file_path = os.path.join("submitted_configs", filename)
        os.makedirs("submitted_configs", exist_ok=True)

        with open(file_path, "w") as f:
            json.dump(response_json, f, indent=4)

        return jsonify({"message": "Config saved", "filename": filename}), 200

    except Exception as e:
        print("❌ Exception occurred:", str(e))
        return jsonify({"error": f"Bad Request: {str(e)}"}), 400


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        ssl_context=("cert.pem", "key.pem"),
        port=2020,
        threaded=True,
        debug=True,
    )
