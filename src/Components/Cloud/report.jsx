import React, { useEffect, useState, useRef } from 'react';
import { Divider, Card, Progress, Row, Col, Flex, Spin, Button } from 'antd';
import { CloudOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : 'Cloud';
};

const hostIP = window.location.hostname;

const Report = ({ onDeploymentComplete }) => {
  const navigate = useNavigate();
  const [completionWindowActive, setCompletionWindowActive] = useState(false);
  const completionWindowTimeoutRef = useRef(null);
  const revertedRef = useRef(false);
  const cloudName = getCloudNameFromMetadata();
  const [percent, setPercent] = useState(0);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [error, setError] = useState(null);
  const [deploymentPollingStopped, setDeploymentPollingStopped] = useState(false);
  const serveridRef = useRef(sessionStorage.getItem('currentCloudServerid') || null);
  const logStartedRef = useRef(false);
  const intervalRef = useRef(null);

  // Backend deployment progress polling
  const [deploymentInProgress, setDeploymentInProgress] = useState(true);
  // Placeholder for completed image path
  const completedImage = require('../../Images/completed.png'); // Change later

  useEffect(() => {
    let interval = setInterval(() => {
      fetch(`https://${hostIP}:2020/node-deployment-progress`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.in_progress === 'boolean') {
            setDeploymentInProgress(data.in_progress);
          }
        })
        .catch(() => {});
    }, 3000);
    // Initial check
    fetch(`https://${hostIP}:2020/node-deployment-progress`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.in_progress === 'boolean') {
          setDeploymentInProgress(data.in_progress);
        }
      })
      .catch(() => {});
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (percent === 100) {
      const handleBeforeUnload = () => {
        sessionStorage.setItem('cloud_shouldResetOnNextMount', 'true');
        sessionStorage.setItem('lastMenuPath', '/addnode');
        sessionStorage.setItem('lastCloudPath', '/addnode');
        sessionStorage.setItem('cloud_activeTab', '1');
        // sessionStorage.setItem('disabledTabs', JSON.stringify({ "2": true, "3": true, "4": true }));
        sessionStorage.setItem('cloud_disabledTabs', JSON.stringify({ "2": true, "3": true, "4": true }));
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        sessionStorage.setItem('cloud_shouldResetOnNextMount', 'true');
        sessionStorage.setItem('lastMenuPath', '/addnode');
        sessionStorage.setItem('lastCloudPath', '/addnode');
        sessionStorage.setItem('cloud_activeTab', '1');
        // sessionStorage.setItem('disabledTabs', JSON.stringify({ "2": true, "3": true, "4": true }));
        sessionStorage.setItem('cloud_disabledTabs', JSON.stringify({ "2": true, "3": true, "4": true }));
      };
    }
  }, [percent]);

  return (
    <div style={{ padding: '20px' }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.25%" }}>
        Node Addition Status
      </h5>
      <Divider />
      <Card title={`Cloud Deployment Progress for ${cloudName} (${sessionStorage.getItem('cloud_server_ip') || 'N/A'})`}>
        <Row gutter={24}>
          <Col span={24}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
              {deploymentInProgress ? (
                <>
                  <img
                    src={require('./../../Images/plane.gif')}
                    alt="Deployment Progress"
                    style={{ width: 180, height: 180, objectFit: 'contain' }}
                  />
                  <div style={{ marginTop: 16, fontWeight: 500 }}>Deployment in progress</div>
                </>
              ) : (
                <>
                  <img
                    src={completedImage}
                    alt="Deployment Completed"
                    style={{ width: 180, height: 180, objectFit: 'contain' }}
                  />
                  <div style={{ marginTop: 16, fontWeight: 500 }}>Deployment completed</div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Report;


{/* <Card title={`Cloud Deployment Progress for ${cloudName} (${sessionStorage.getItem('cloud_server_ip') || 'N/A'})`}>
<Row gutter={24}>
  <Col span={24}>
    <Flex gap="small" vertical style={{ marginBottom: '20px' }}>
      <Progress percent={percent} status={percent === 100 ? "success" : "active"} />
    </Flex>
    {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        padding: '12px',
        backgroundColor: '#fafafa',
      }}
    >
      <strong>Cloud Deployment Progress:</strong>
      <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
        {progressList}
      </ul>
    </div>
    {percent === 100 && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Button 
          type="primary" 
          onClick={() => {
            sessionStorage.setItem('cloud_shouldResetOnNextMount', 'true');
            sessionStorage.setItem('lastMenuPath', '/iaas');
            sessionStorage.setItem('lastCloudPath', '/iaas');
            navigate('/iaas');
          }}
        >
          Back to Cloud
        </Button>
      </div>
    )}
  </Col>
</Row>
</Card> */}