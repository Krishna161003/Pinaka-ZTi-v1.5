import React, { useState, useEffect } from "react";
import Layout1 from "../Components/layout";
import { theme, Layout, Card, Button, Modal, Spin, Empty, message, Tag } from "antd";


const { Content } = Layout;

const Inventory = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [serverData, setServerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [serverStatus, setServerStatus] = useState({}); // Track power status and last checked per server
 const hostIP = process.env.REACT_APP_HOST_IP || "localhost";  //retrive host ip

  // Fetch server data on component mount
  useEffect(() => {
    const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));
    const userID = loginDetails ? loginDetails.data.id : null;

    if (!userID) {
      console.error("User ID not found in local storage");
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Fetching data with userID:", userID);
    fetch(`https://${hostIP}:8000/power-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID }), // Only send userID on initial load, no action
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setServerData(data); // Directly set the array of servers
        } else {
          setServerData([]); // Set an empty array if no data is found
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching server data:", error);
        setServerData([]);
        setLoading(false);
      });
  }, []);

  // Retrieve power status and last checked time for each server from sessionStorage
  useEffect(() => {
    const statusData = {};
    serverData.forEach((server) => {
      const storedPowerStatus = sessionStorage.getItem(`powerStatus_${server.bmc_ip}`);
      const storedLastChecked = sessionStorage.getItem(`lastChecked_${server.bmc_ip}`);
      if (storedPowerStatus) {
        statusData[server.bmc_ip] = {
          powerStatus: storedPowerStatus,
          lastChecked: storedLastChecked,
        };
      }
    });
    setServerStatus(statusData);
  }, [serverData]);

  const storeServerStatus = (server, newPowerStatus, formattedTime) => {
    sessionStorage.setItem(`powerStatus_${server.bmc_ip}`, newPowerStatus);
    sessionStorage.setItem(`lastChecked_${server.bmc_ip}`, formattedTime);

    setServerStatus((prev) => ({
      ...prev,
      [server.bmc_ip]: { powerStatus: newPowerStatus, lastChecked: formattedTime },
    }));
  };

  const sendPowerRequest = async (action, server) => {
    const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));
    const userID = loginDetails ? loginDetails.data.id : null;

    if (!userID) {
      message.error("User ID not found");
      return;
    }

    if (!["on", "off", "reset", "status"].includes(action)) {
      message.error("Invalid action");
      return;
    }

    setLoading(true);

    fetch(`https://${hostIP}:8000/power-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, action, serverIP: server.bmc_ip, cloudName: server.cloudName }), // Pass cloudName
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Response from Flask server:", data); // Debugging log

        if (Array.isArray(data) && data.length > 0) {
          const serverResponse = data[0]; // Access the first server object from the response
          if (serverResponse.message) {
            message.success(`${serverResponse.message}`);
            if (action === "status") {
              const currentDate = new Date();
              const formattedTime = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
              const newPowerStatus = serverResponse.message.includes("on") ? "on" : "off";

              // Store power status and last checked time for the server
              storeServerStatus(server, newPowerStatus, formattedTime);
            }
          }
        } else {
          message.error(`Failed to ${action} the server: No valid response data`);
        }
      })
      .catch((error) => {
        console.error("Error sending power request:", error);
        message.error("An error occurred while sending the request.");
      })
      .finally(() => setLoading(false));
  };

  const showConfirmationModal = (action, server) => {
    setActionType(action);
    setSelectedServer(server);
    setIsModalVisible(true);
  };

  const handleConfirmAction = () => {
    setIsModalVisible(false);
    if (actionType && selectedServer) {
      sendPowerRequest(actionType, selectedServer); // Pass the server object here
    }
  };

  const handleCancelAction = () => {
    setIsModalVisible(false);
  };

  const renderServerDetails = () => {
    if (loading) {
      return <Spin tip="Loading server information..." />;
    }

    if (!serverData || serverData.length === 0) {
      return <Empty description="No servers available." />;
    }

    return serverData.map((server) => (
      <Card
        key={server.bmc_ip} // Use bmc_ip as a unique key
        title={`${server.cloudName} Cloud - ${server.bmc_ip}`}
        style={{
          marginTop: 20,
          borderRadius: borderRadiusLG,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Button
              type="primary"
              size="small"
              style={{ width: "80px" }}
              onClick={() => showConfirmationModal("on", server)}
            >
              Power On
            </Button>
            <Button
              danger
              type="primary"
              size="small"
              style={{ width: "80px" }}
              onClick={() => showConfirmationModal("off", server)}
            >
              Power Off
            </Button>
            <Button
              type="default"
              size="small"
              style={{ width: "80px" }}
              onClick={() => showConfirmationModal("reset", server)}
            >
              Reset
            </Button>
            <Button
              type="dashed"
              size="small"
              style={{ width: "80px" }}
              onClick={() => showConfirmationModal("status", server)}
            >
              Status
            </Button>
          </div>

          {serverStatus[server.bmc_ip] && (
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center" }}>
              {serverStatus[server.bmc_ip].powerStatus === "on" ? (
                <Tag color="green" style={{ marginLeft: "10px" }}>
                  <span style={{ marginRight: "5px" }}>•</span> Power On
                </Tag>
              ) : (
                <Tag color="red" style={{ marginLeft: "10px" }}>
                  <span style={{ marginRight: "5px" }}>•</span> Power Off
                </Tag>
              )}
              {serverStatus[server.bmc_ip].lastChecked && (
                <span style={{ marginLeft: "10px", fontStyle: "italic" }}>
                  Last checked: {serverStatus[server.bmc_ip].lastChecked}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    ));
  };

  return (
    <Layout1>
      <Layout>
        <Content style={{ margin: "16px 16px" }}>
          <div
            style={{
              padding: 30,
              minHeight: "auto",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <h2>Inventory</h2>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: 30,
              minHeight: "auto",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {renderServerDetails()}
          </div>
        </Content>

        <Modal
          title={`Confirm ${actionType}`}
          visible={isModalVisible}
          onOk={handleConfirmAction}
          onCancel={handleCancelAction}
          okText="Confirm"
          cancelText="Cancel"
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <Button onClick={handleCancelAction} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAction} type="primary">
                Confirm
              </Button>
            </div>
          }
        >
          <p>Are you sure you want to {actionType} the server {selectedServer && selectedServer.bmc_ip}?</p>
        </Modal>
      </Layout>
    </Layout1>
  );
};

export default Inventory;
