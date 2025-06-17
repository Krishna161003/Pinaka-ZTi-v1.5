import React, { useState, useEffect } from 'react';
import Layout1 from '../Components/layout';
import { theme, Layout, Card, Collapse, Empty, Spin, Button, Modal, Tabs } from 'antd';

const { Content } = Layout;
const { Panel } = Collapse;

const Iaas = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [activeTab, setActiveTab] = useState("1");
  const [disabledTabs] = useState({ "1": false });
  const [serverInfoAllInOne, setServerInfoAllInOne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
 const hostIP = process.env.REACT_APP_HOST_IP || "localhost";  //retrive host ip


  useEffect(() => {
    const loginDetails = JSON.parse(sessionStorage.getItem('loginDetails'));
    const userID = loginDetails ? loginDetails.data.id : null;

    if (!userID) {
      console.error("User ID not found in local storage");
      setLoading(false);
      return;
    }

    setLoading(true);

fetch(`https://${hostIP}:5000/api/allinone?userID=${userID}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        // If data is an array, set it directly
        setServerInfoAllInOne(data);
      } else if (data.message) {
        // If response contains a message, handle it
        console.log(data.message);
        setServerInfoAllInOne([]); // Set empty data for now
      } else {
        console.warn("Unexpected response format:", data);
        setServerInfoAllInOne([]); // Fallback to empty data
      }
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching All-in-One data:', error);
      setLoading(false);
    });
}, []);

  const showConfirmationModal = (action) => {
    setActionType(action);
    setIsModalVisible(true);
  };

  const handleConfirmAction = () => {
    setIsModalVisible(false);
    if (actionType) {
      console.log(`${actionType} action confirmed for All-in-One Server`);
    }
  };

  const formatDate = (dateStr) => {
    const formattedDate = dateStr.replace('T', ' ').replace('Z', '').replace(/\.\d+$/, '');
    return formattedDate;
  };

  const handleCancelAction = () => {
    setIsModalVisible(false);
  };

  const renderServerDetails = (serverInfo) => {
    if (loading) {
      return <Spin tip="Loading server information..." />;
    }

    if (!serverInfo || serverInfo.length === 0) {
      return <Empty description="No deployment available." />;
    }

    return serverInfo.map((server, index) => {
      const { cloudName, Ip, SkylineURL, CephURL, deployment_time, bmc_ip } = server;

      return (
        <Card
          key={index}
          title={`${cloudName} Cloud (${Ip})`}
          style={{
            marginTop: 20,
            borderRadius: borderRadiusLG,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Collapse bordered={false} ghost>
            <Panel header="Server Details" key={index}>
              <p><strong>Skyline URL:</strong> <a href={SkylineURL}>{SkylineURL}</a></p>
              <p><strong>Ceph URL&nbsp;&nbsp;&nbsp;:</strong> <a href={CephURL}>{CephURL}</a></p>
              <p><strong>Deployment Time:</strong> {formatDate(deployment_time)}</p>
              <p><strong>BMC IP:</strong> {bmc_ip}</p>
            </Panel>
          </Collapse>
        </Card>
      );
    });
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
            <h2 style={{ marginTop: '0px' }}>Infrastructure as a Service (IaaS)</h2>
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
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              tabBarStyle={{
                display: "flex",
                justifyContent: "space-between",
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                padding: "10px",
              }}
              centered
              style={{ border: 'none' }} // Remove extra borders
            >
              {/* All-in-One Tab */}
              <Tabs.TabPane
                tab={
                  <div
                    style={{
                      padding: "10px 30px",
                      color: '#000',
                      borderRadius: borderRadiusLG,
                      textAlign: "center",
                      cursor: "pointer",
                      width: "100%",
                      fontSize: "15px",
                    }}
                  >
                    All-in-One
                  </div>
                }
                key="1"
              >
                <div style={{ padding: 20 }}>
                  <h4>All-in-One Deployment</h4>
                  {renderServerDetails(serverInfoAllInOne)}
                </div>
              </Tabs.TabPane>

              {/* Multinode Tab */}
              <Tabs.TabPane
                disabled={disabledTabs["1"]}
                tab={
                  <div
                    style={{
                      padding: "10px 30px",
                      color: "#000",
                      borderRadius: borderRadiusLG,
                      textAlign: "center",
                      cursor: 'unset',
                      width: "100%",
                      fontSize: "15px", // Increase text size here
                    }}
                  >
                    Multinode
                  </div>
                }
                key="2"
              >
                <div style={{ padding: 20 }}>
                  <h4>Multinode Deployment</h4>
                  <Empty description="No deployment available." />
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
    </Layout1>
  );
};

export default Iaas;
