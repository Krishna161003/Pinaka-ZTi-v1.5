import React, { useState, useEffect } from 'react';
import Layout1 from '../Components/layout';
import { Layout, Row, Col, Tabs, Table, theme } from 'antd';
import upImage from '../Images/up_15362984.png';
import downImage from '../Images/down_15362973.png';
import node from '../Images/database_666406.png';

const { Content } = Layout;
const style = {
  background: '#fff',
  padding: '16px 20px', // Reduced vertical padding for shorter Col height
  marginTop: '19px',
  marginRight: '25px',
  borderRadius: '10px',
  cursor: 'pointer',
  boxShadow: '10px',
};




const Inventory = () => {

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  useEffect(() => {

  }, []);

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
                      Total Server
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
                    <img src={upImage} alt="server" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        marginTop: "4px",
                        userSelect: "none",
                        textAlign: "center"
                      }}
                    >
                      Online Server
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "80px", justifyContent: "center", marginLeft: "20px" }}>
                    <img src={downImage} alt="cloud-development--v3" style={{ width: "64px", height: "64px", userSelect: "none" }} />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "500",
                        marginTop: "4px",
                        userSelect: "none",
                        textAlign: "center"
                      }}
                    >
                      Offline Server
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
            <div
              style={{
                marginTop: 10,
                padding: 30,
                minHeight: "auto",
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                marginLeft: "20px",
                marginRight: "17px",
              }}
            >
              <div style={{ width: '100%' }}>
                <Tabs
                  defaultActiveKey="1"
                  style={{ width: '100%' }}
                  tabBarStyle={{ width: '100%' }}
                  moreIcon={null}
                  items={[
                    {
                      label: <span style={{ width: '100%', display: 'block', textAlign: 'center' }}>Flight Deck</span>,
                      key: '1',
                      children: (
  <Table
    columns={[
      { title: 'ID', dataIndex: 'id', key: 'id' },
      { title: 'Cloud Name', dataIndex: 'cloudname', key: 'cloudname' },
      { title: 'Status', dataIndex: 'status', key: 'status' }
    ]}
    dataSource={[
      { key: '1', id: 'FD-001', cloudname: 'Alpha', status: 'Active' },
      { key: '2', id: 'FD-002', cloudname: 'Bravo', status: 'Inactive' }
    ]}
    pagination={false}
  />
)
                    },
                    {
                      label: <span style={{ width: '100%', display: 'block', textAlign: 'center' }}>Squadron</span>,
                      key: '2',
                      children: (
  <Table
    columns={[
      { title: 'ID', dataIndex: 'id', key: 'id' },
      { title: 'Cloud Name', dataIndex: 'cloudname', key: 'cloudname' },
      { title: 'Status', dataIndex: 'status', key: 'status' }
    ]}
    dataSource={[
      { key: '1', id: 'SQ-101', cloudname: 'Eagle', status: 'Ready' },
      { key: '2', id: 'SQ-102', cloudname: 'Falcon', status: 'Standby' }
    ]}
    pagination={false}
  />
)
                    }
                  ]}
                />
                {/* Custom style for AntD tabs to make tabs fill and center */}
                <style>{`
                  .ant-tabs-nav {
                    width: 100%;
                  }
                  .ant-tabs-nav-list {
                    width: 100%;
                    display: flex !important;
                  }
                  .ant-tabs-tab {
                    flex: 1 1 0;
                    justify-content: center;
                    text-align: center;
                    margin: 0 !important;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout1>
  );
};

export default Inventory;
