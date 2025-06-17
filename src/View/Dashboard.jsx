import React, { useState, useEffect } from "react";
import Layout1 from "../Components/layout";
import { theme, Layout, Card } from "antd";
import PasswordUpdateForm from "../Components/PasswordUpdateForm";

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

  if (isLoading) return <div>Loading...</div>; // Optional loading state

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
              userSelect: "none",
            }}
          >
            <h2>Dashboard</h2>
          </div>

          <div
            style={{
              padding: 30,
              minHeight: "auto",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Card
              title="User Stats"
              style={{
                width: "30%",
                marginBottom: "20px",
              }}
            >
              <p>Card content: User Data</p>
              <p>Card content: User Activity</p>
              <p>Card content: Other Stats</p>
            </Card>
          </div>
        </Content>
      </Layout>

      {/* Password Update Modal Form */}
      <PasswordUpdateForm
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </Layout1>
  );
};

export default Dashboard;

