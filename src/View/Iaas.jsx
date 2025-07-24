import React, { useState, useEffect } from 'react';
import Layout1 from '../Components/layout';
import { theme, Layout } from 'antd';

const { Content } = Layout;

const Iaas = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();


  useEffect(() => {


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
