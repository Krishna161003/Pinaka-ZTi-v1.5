import React, { useState, useEffect } from 'react';
import Layout1 from '../Components/layout';
import { theme, Layout } from 'antd';

const { Content } = Layout;

const Iaas = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [activeTab, setActiveTab] = useState("1");
  const [disabledTabs] = useState({ "1": false });
  const [serverInfoAllInOne, setServerInfoAllInOne] = useState(null);
  const [loading, setLoading] = useState(true);
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

  }, []);

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

          </div>
        </Content>
      </Layout>
    </Layout1>
  );
};

export default Iaas;
