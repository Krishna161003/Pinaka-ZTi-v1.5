import React from 'react';
import { Breadcrumb, Divider, Card, Progress, Row, Col, Flex } from 'antd';
import { HomeOutlined,CloudOutlined } from '@ant-design/icons';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : 'Default';
};

const hostIP = window.location.hostname;

const Report = () => {
  const cloudName = getCloudNameFromMetadata();

  // Dummy log data
  const completedLogs = [
    'Step 1: Initialized',
    'Step 2: Resources created',
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.25%" }}>
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>
      <Divider/>
      <Card title={`Progress Report for ${cloudName} Cloud (${hostIP})`}>
        <Row gutter={24}>
          <Col span={24}>
            <Flex gap="small" vertical style={{ marginBottom: '20px' }}>
              <Progress percent={50} status="active" />
            </Flex>

            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              <strong>Completed Steps:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                {completedLogs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Report;
