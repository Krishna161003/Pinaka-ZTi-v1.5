import React, { useState, useEffect } from "react";
import Layout1 from "../Components/layout";
import { theme, Layout, Spin, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import PasswordUpdateForm from "../Components/PasswordUpdateForm";
import node from "../Images/database_666406.png";
import cloud from "../Images/cloud-computing_660475.png";
import squad from "../Images/database_2231963.png";
import { Gauge } from '@ant-design/plots';
const style = {
  background: '#fff',
  padding: '16px 20px', // Reduced vertical padding for shorter Col height
  marginTop: '19px',
  marginRight: '25px',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
  transition: 'all 0.3s ease',
};

const hoverStyle = {
  ...style,
  transform: 'translateY(-3px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

const { Content } = Layout;

const Dashboard = () => {
  // --- CPU & Memory Utilization State ---
  const [cpuData, setCpuData] = useState(0);
  const [memoryData, setMemoryData] = useState(0);
  const [totalMemory, setTotalMemory] = useState(0);
  const [usedMemory, setUsedMemory] = useState(0);

  useEffect(() => {
    async function fetchUtilization() {
      try {
        const hostIP = process.env.REACT_APP_HOST_IP;
        const res = await fetch(`https://${hostIP}:2020/system-utilization`);
        const data = await res.json();
        // Defensive: Check for error key or invalid values
        if (
          data.error ||
          typeof data.cpu !== 'number' || isNaN(data.cpu) ||
          typeof data.memory !== 'number' || isNaN(data.memory) ||
          typeof data.total_memory !== 'number' || isNaN(data.total_memory) ||
          typeof data.used_memory !== 'number' || isNaN(data.used_memory)
        ) {
          setCpuData(0);
          setMemoryData(0);
          setTotalMemory(0);
          setUsedMemory(0);
        } else {
          setCpuData(data.cpu);
          setMemoryData(data.memory);
          setTotalMemory(data.total_memory);
          setUsedMemory(data.used_memory);
        }
      } catch (err) {
        setCpuData(0);
        setMemoryData(0);
        setTotalMemory(0);
        setUsedMemory(0);
      }
    }
    fetchUtilization();
    const interval = setInterval(fetchUtilization, 10000);
    return () => clearInterval(interval);
  }, []);



  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading state
  const [counts, setCounts] = useState({
    cloudCount: 0,
    flightDeckCount: 0,
    squadronCount: 0
  });
  // State for hover effects
  const [hoveredCard, setHoveredCard] = useState(null);

  const navigate = useNavigate();
  const storedData = JSON.parse(sessionStorage.getItem("loginDetails")) || {};
  const userId = storedData?.data?.id || "";
  const hostIP = process.env.REACT_APP_HOST_IP;

  // Function to navigate to Iaas page with specific tab
  const navigateToIaasTab = (tabKey) => {
    navigate(`/iaas?tab=${tabKey}`);
    // Also save the active tab in session storage for persistence
    sessionStorage.setItem("iaas_activeTab", tabKey);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check password status
        const passwordResponse = await fetch(`https://${hostIP}:5000/api/check-password-status/${userId}`);
        const passwordData = await passwordResponse.json();

        if (passwordData.updatePwdStatus === 1) {
          setIsModalVisible(false); // Don't show modal if password updated
        } else {
          setIsModalVisible(true); // Show modal if password not updated
        }

        // Fetch dashboard counts
        const countsResponse = await fetch(`https://${hostIP}:5000/api/dashboard-counts/${userId}`);
        const countsData = await countsResponse.json();

        setCounts({
          cloudCount: countsData.cloudCount || 0,
          flightDeckCount: countsData.flightDeckCount || 0,
          squadronCount: countsData.squadronCount || 0
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Hide loading after all fetches
      }
    };

    if (userId) {
      fetchData();
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
                style={hoveredCard === 'cloud' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("1")}
                onMouseEnter={() => setHoveredCard('cloud')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
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
                    {counts.cloudCount}
                  </span>
                </div>
              </Col>

              <Col
                className="gutter-row"
                span={7}
                style={hoveredCard === 'flightDeck' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("2")}
                onMouseEnter={() => setHoveredCard('flightDeck')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
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
                    {counts.flightDeckCount}
                  </span>
                </div>
              </Col>

              <Col
                className="gutter-row"
                span={7}
                style={hoveredCard === 'squadron' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("3")}
                onMouseEnter={() => setHoveredCard('squadron')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  {/* Left: Image + Label (vertical) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
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
                    {counts.squadronCount}
                  </span>
                </div>
              </Col>
            </Row>
          </div>
          <Row gutter={24} justify="center" style={{ marginTop: 32, marginBottom: 16 }}>
            <Col span={9}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 8, minHeight: 100, width: 240, margin: '0 auto' }}>
            <h4 style={{ textAlign: 'center', marginBottom: 12 }}>CPU Utilization</h4>
                <Gauge
                  autoFit={false}
                  width={220}
                  height={260} // Set a smaller height here (adjust as needed)
                  data={{
                    target: cpuData ?? 0,
                    total: 100,
                    name: 'CPU',
                    thresholds: [50, 75, 100],
                  }}
                  scale={{
                    color: {
                      range: ['green', '#FAAD14', '#F4664A'],
                    },
                  }}
                  style={{
                    textContent: (target, total) =>
                      `CPU: ${target}%\nUsage: ${(target / total * 100).toFixed(1)}%`,
                  }}
                />

              </div>
            </Col>
            <Col span={2} /> {/* Spacer column for separation */}
            <Col span={9}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 8, minHeight: 100, width: 260, margin: '0 auto' }}>
            <h4 style={{ textAlign: 'center', marginBottom: 12 }}>Memory Utilization</h4>
                <Gauge
                  autoFit={false}
                  width={220}
                  height={260} // Match the height here as well
                  data={{
                    target: memoryData ?? 0,
                    total: 100,
                    name: 'Memory',
                    thresholds: [50, 75, 100],
                  }}
                  scale={{
                    color: {
                      range: ['green', '#FAAD14', '#F4664A'],
                    },
                  }}
                  style={{
                    textContent: () =>
                      `Used: ${usedMemory} MB / ${totalMemory} MB\nUsage: ${memoryData.toFixed(1)}%`,
                  }}
                />

              </div>
            </Col>
          </Row>

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
