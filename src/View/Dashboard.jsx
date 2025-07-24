import React, { useState, useEffect } from "react";
import Layout1 from "../Components/layout";
import { theme, Layout, Spin, Row, Col } from "antd";
import PasswordUpdateForm from "../Components/PasswordUpdateForm";
import node from "../Images/database_666406.png";
import cloud from "../Images/cloud-computing_660475.png";
import squad from "../Images/database_2231963.png";
const style = {
  background: '#fff',
  padding: '16px 20px', // Reduced vertical padding for shorter Col height
  marginTop: '19px',
  marginRight: '25px',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '10px',
};

const { Content } = Layout;

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading state
  const storedData = JSON.parse(sessionStorage.getItem("loginDetails")) || {};
  const userId = storedData?.data?.id || "";
  const hostIP = process.env.REACT_APP_HOST_IP;

  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch(`https://${hostIP}:5000/api/check-password-status/${userId}`);
        const data = await response.json();

        if (data.updatePwdStatus === 1) {
          setIsModalVisible(false); // Don't show modal if password updated
        } else {
          setIsModalVisible(true); // Show modal if password not updated
        }
      } catch (error) {
        console.error("Error checking password status:", error);
      } finally {
        setIsLoading(false); // Hide loading after check
      }
    };

    if (userId) {
      checkPasswordStatus();
    } else {
      setIsLoading(false); // Hide loading if no userId
    }
  }, [userId, hostIP]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  if (isLoading) return (
    <Layout1>
      <Layout>
        <Content style={{ margin: "16px 16px" }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    </Layout1>
  );

  return (
    <Layout1>
      <Layout>
        <Content>
          <div>
            <Row
              gutter={16} // Added gutter for spacing
              justify="space-between" // Ensures equal spacing between the columns
              style={{ marginLeft: "20px" }} // Added marginLeft to shift everything a bit to the right
            >
              <Col
                className="gutter-row"
                span={7}
                style={style}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center",marginLeft:"20px" }}>
                    <img src={cloud} alt="cloud--v1" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        marginTop: "4px",
                        userSelect: "none",
                        textAlign: "center"
                      }}
                    >
                      Cloud
                    </span>
                  </div>
                  {/* Right: Count */}
                  <span
                    style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#1890ff",
                      marginRight: "50px",
                      userSelect: "none",
                    }}
                  >
                    12
                  </span>
                </div>
              </Col>

              <Col
                className="gutter-row"
                span={7}
                style={style}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center",marginLeft:"20px" }}>
                    <img src={node} alt="server" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        marginTop: "4px",
                        userSelect: "none",
                        textAlign: "center"
                      }}
                    >
                      Flight Deck
                    </span>
                  </div>
                  {/* Right: Count */}
                  <span
                    style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#1890ff",
                      marginRight: "50px",
                      userSelect: "none",
                    }}
                  >
                    7
                  </span>
                </div>
              </Col>

              <Col
                className="gutter-row"
                span={7}
                style={style}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center",marginLeft:"20px" }}>
                    <img src={squad} alt="cloud-development--v3" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        marginTop: "4px",
                        userSelect: "none",
                        textAlign: "center"
                      }}
                    >
                      Squadron
                    </span>
                  </div>
                  {/* Right: Count */}
                  <span
                    style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#1890ff",
                      marginRight: "50px",
                      userSelect: "none",
                    }}
                  >
                    9
                  </span>
                </div>
              </Col>
            </Row>
          </div>
          {/* Password Update Modal Form */}
          <PasswordUpdateForm
            isModalVisible={isModalVisible}
            setIsModalVisible={setIsModalVisible}
          />
        </Content>
      </Layout>
    </Layout1>
  );
};

export default Dashboard;
