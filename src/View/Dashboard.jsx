import React, { useState, useEffect } from "react";
import Layout1 from "../Components/layout";
import { theme, Layout, Spin, Row, Col, Divider, Select } from "antd";
import { useNavigate } from "react-router-dom";
import PasswordUpdateForm from "../Components/PasswordUpdateForm";
import node from "../Images/database_666406.png";
import cloud from "../Images/cloud-computing_660475.png";
import squad from "../Images/database_2231963.png";
import { Area, Column, Gauge } from '@ant-design/plots';
const style = {
  background: '#fff',
  padding: '16px 20px', // Reduced vertical padding for shorter Col height
  marginTop: '19px',
  marginRight: '25px',
  // borderRadius: '10px',
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
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryData, setMemoryData] = useState(0);
  const [totalMemory, setTotalMemory] = useState(0);
  const [usedMemory, setUsedMemory] = useState(0);

  // Host IP dropdown state
  const hostIpOptions = [
    window.location.hostname,
    "192.168.1.10",
    "192.168.1.20",
    "10.0.0.5"
  ];
  const [selectedHostIP, setSelectedHostIP] = useState(window.location.hostname);

  // Fetch CPU time series for Area chart
  useEffect(() => {
    async function fetchCpuHistory() {
      try {
        const res = await fetch(`https://${selectedHostIP}:2020/system-utilization-history`);
        const data = await res.json();
        // console.log('Fetched CPU history:', data);
        if (data && Array.isArray(data.cpu_history)) {
          setCpuHistory(
            data.cpu_history.map(item => {
              const cpuVal = typeof item.cpu === 'number' && !isNaN(item.cpu) ? item.cpu : 0;
              return {
                date: new Date(item.timestamp * 1000),
                cpu: cpuVal
              };
            })
          );
        } else {
          setCpuHistory([]);
        }
      } catch (err) {
        setCpuHistory([]);
      }
    }
    fetchCpuHistory();
    const interval = setInterval(fetchCpuHistory, 10000);
    return () => clearInterval(interval);
  }, [selectedHostIP]);

  // Still fetch memory and single CPU value for other UI
  useEffect(() => {
    async function fetchUtilization() {
      try {
        const res = await fetch(`https://${selectedHostIP}:2020/system-utilization`);
        const data = await res.json();
        // console.log('Fetched utilization:', data);
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
  }, [selectedHostIP]);



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
        const passwordResponse = await fetch(`https://${selectedHostIP}:5000/api/check-password-status/${userId}`);
        const passwordData = await passwordResponse.json();

        if (passwordData.updatePwdStatus === 1) {
          setIsModalVisible(false); // Don't show modal if password updated
        } else {
          setIsModalVisible(true); // Show modal if password not updated
        }

        // Fetch dashboard counts
        const countsResponse = await fetch(`https://${selectedHostIP}:5000/api/dashboard-counts/${userId}`);
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
  }, [userId, selectedHostIP]);

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
            {/* Host IP Dropdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '0 0 16px 0' }}>
              <span style={{ marginRight: 8, fontWeight: 500 }}>Host IP:</span>
              <Select
                style={{ width: 220 }}
                value={selectedHostIP}
                onChange={setSelectedHostIP}
                options={hostIpOptions.map(ip => ({ label: ip, value: ip }))}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
            </div>
            {/* First row: summary cards */}
            <Row gutter={16} justify="space-between" style={{ marginLeft: "20px" }}>
              <Col className="gutter-row" span={7} style={hoveredCard === 'cloud' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("1")}
                onMouseEnter={() => setHoveredCard('cloud')}
                onMouseLeave={() => setHoveredCard(null)}>
                {/* ...Cloud card content... */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
                    <img src={cloud} alt="cloud--v1" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span style={{ fontSize: "15px", fontWeight: "500", marginTop: "4px", userSelect: "none", textAlign: "center" }}>Cloud</span>
                  </div>
                  <span style={{ fontSize: "32px", fontWeight: "bold", color: "#1890ff", marginRight: "50px", userSelect: "none" }}>{counts.cloudCount}</span>
                </div>
              </Col>
              <Col className="gutter-row" span={7} style={hoveredCard === 'flightDeck' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("2")}
                onMouseEnter={() => setHoveredCard('flightDeck')}
                onMouseLeave={() => setHoveredCard(null)}>
                {/* ...Flight Deck card content... */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
                    <img src={node} alt="server" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span style={{ fontSize: "15px", fontWeight: "500", marginTop: "4px", userSelect: "none", textAlign: "center" }}>Flight Deck</span>
                  </div>
                  <span style={{ fontSize: "32px", fontWeight: "bold", color: "#1890ff", marginRight: "50px", userSelect: "none" }}>{counts.flightDeckCount}</span>
                </div>
              </Col>
              <Col className="gutter-row" span={7} style={hoveredCard === 'squadron' ? hoverStyle : style}
                onClick={() => navigateToIaasTab("3")}
                onMouseEnter={() => setHoveredCard('squadron')}
                onMouseLeave={() => setHoveredCard(null)}>
                {/* ...Squadron card content... */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
                    <img src={squad} alt="cloud-development--v3" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span style={{ fontSize: "15px", fontWeight: "500", marginTop: "4px", userSelect: "none", textAlign: "center" }}>Squadron</span>
                  </div>
                  <span style={{ fontSize: "32px", fontWeight: "bold", color: "#1890ff", marginRight: "50px", userSelect: "none" }}>{counts.squadronCount}</span>
                </div>
              </Col>
            </Row>
            {/* Second row: CPU and Memory cards side by side */}
            <Row gutter={32} justify="center" style={{ marginTop: 28, marginBottom: 32 }}>
              <Col span={23} style={{ display: 'flex', justifyContent: 'center', marginLeft: "-9px", gap: 24, width: '100%', boxSizing: 'border-box' }}>
                {/* CPU Utilization Card */}
                <div
                  style={{
                    background: '#fff',
                    // borderRadius: '10px',
                    padding: '10px 10px',
                    // minHeight: 0,
                    height:'75%',
                    width: '70%',
                    maxWidth: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: 17, color: '#1890ff', fontWeight: 600,marginBottom: -14,marginTop: 6, letterSpacing: 0.2 }}>CPU Usage Trend</div>
                  <Divider />
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 6,marginTop: -16 }}>
                    Current: {cpuData.toFixed(1)}%
                  </div>
                  <div style={{ width: '95%', display: 'flex', justifyContent: 'center', marginLeft: "120px", marginBottom: "100px" }}>
                    <Area
                      data={cpuHistory}
                      xField="date"
                      yField="cpu"
                      height={180}
                      width={260}
                      areaStyle={{ fill: 'l(270) 0:#1890ff 1:#e6f7ff' }}
                    />
                  </div>
                </div>
                {/* Memory Utilization Card */}
                <div
                  style={{
                    background: '#fff',
                    // borderRadius: '10px',
                    padding: '10px 10px',
                    minHeight: 50,
                    height:'75%',
                    width: '70%',
                    maxWidth: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    boxSizing: 'border-box',
                    marginRight: "-12px"
                  }}
                >
                  <div style={{ fontSize: 17, color: '#1890ff', fontWeight: 600, marginBottom: -14,marginTop: 6, letterSpacing: 0.2 }}>Memory Usage Trend</div>
                  <Divider />
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 6,marginTop: -16 }}>
                    Used: {usedMemory} MB / {totalMemory} MB<br />
                    Usage: {memoryData.toFixed(1)}%
                  </div>

                  <div style={{ width: '95%', display: 'flex', justifyContent: 'center', marginLeft: "120px", marginTop: -40 }}>
                    <Gauge
                      style={{ marginBottom: -30 }}
                      autoFit={false}
                      width={260}
                      height={260}
                      data={{
                        target: memoryData ?? 0,
                        total: 100,
                        name: 'Memory',
                        thresholds: [50, 75, 100],
                      }}
                      scale={{
                        color: {
                          range: ['#62CFF4', '#2C67F2', '#00008B'],
                        },
                      }}
                      statistic={{
                        title: true,
                        contentStyle: { fontSize: 15, fontWeight: 400 },
                      }}
                    />
                  </div>
                </div>
              </Col>
            </Row>
            {/* Password Update Modal Form */}
            <PasswordUpdateForm
              isModalVisible={isModalVisible}
              setIsModalVisible={setIsModalVisible}
            />
          </div>
        </Content>

      </Layout>
    </Layout1>
  );
};

export default Dashboard;
