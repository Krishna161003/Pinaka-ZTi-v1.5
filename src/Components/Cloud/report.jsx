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

  useEffect(() => {
    // Session logic only, no backend integration
    let completedTime = null;
    let stopTimeout = null;

    // Simulate progress for UI demonstration
    setPercent(0);
    setCompletedLogs([]);
    setError(null);
    let progress = 0;
    let fakeInterval = setInterval(() => {
      progress += 20;
      setPercent(progress);
      setCompletedLogs(prev => [...prev, allSteps[prev.length]]);
      if (progress >= 100) {
        clearInterval(fakeInterval);
        setDeploymentPollingStopped(true);
      }
    }, 700);

    return () => {
      clearInterval(fakeInterval);
      if (stopTimeout) clearTimeout(stopTimeout);
    };
  }, []);

  const allSteps = [
    'Step 1: Cloud Initialization',
    'Step 2: Cloud Resources Provisioned',
    'Step 3: Network Configuration',
    'Step 4: Services Deployment',
    'Step 5: Finalizing Cloud Setup',
    'Cloud Deployment Completed'
  ];

  let progressList = [];
  let foundInProgress = false;
  
  for (let i = 0; i < allSteps.length; i++) {
    if (i < completedLogs.length) {
      progressList.push(<li key={i}>{allSteps[i]}</li>);
    } else if (!foundInProgress) {
      progressList.push(
        <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <em>{allSteps[i].replace('Step', 'Step') + ' in progress'}</em>
          <Spin size="small" style={{ marginLeft: 8 }} />
        </li>
      );
      foundInProgress = true;
    } else {
      progressList.push(<li key={i} style={{ color: '#bbb' }}>{allSteps[i]}</li>);
    }
  }

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
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>
      <Divider />
      <Card title={`Cloud Deployment Progress for ${cloudName} (${sessionStorage.getItem('cloud_server_ip') || 'N/A'})`}>
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
      </Card>
    </div>
  );
};

export default Report;