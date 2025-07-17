import React, { useEffect, useState } from 'react';
import { Divider, Card, Progress, Row, Col, Flex, Spin } from 'antd';
import { CloudOutlined } from '@ant-design/icons';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : 'Default';
};

const hostIP = window.location.hostname;

const Report = () => {
  const cloudName = getCloudNameFromMetadata();
  const [percent, setPercent] = useState(0);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let completedTime = null;
    let stopTimeout = null;
    let interval = null;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`https://${hostIP}:2020/deployment-progress`);
        if (isMounted) {
          if (res.ok) {
            const data = await res.json();
            setPercent(data.percent || 0);
            setCompletedLogs(data.completed_steps || []);
            setError(null);
            // Check if deployment just completed
            if ((data.percent || 0) === 100 && !completedTime) {
              completedTime = Date.now();
              // Set a timeout to stop polling after 5 minutes
              stopTimeout = setTimeout(() => {
                if (interval) clearInterval(interval);
              }, 300000); // 5 minutes
            }
          } else {
            setPercent(0);
            setCompletedLogs([]);
            setError(null);
          }
        }
      } catch (err) {
        if (isMounted) setError('Failed to connect to backend. Please check your network or server.');
      }
    };
    fetchProgress();
    interval = setInterval(fetchProgress, 2000);
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (stopTimeout) clearTimeout(stopTimeout);
    };
  }, []);

  // Define all possible steps as in backend
  const allSteps = [
    'Step 1: Initialization',
    'Step 2: Resources created',
    'Step 3: Configuration applied',
    'Step 4: Services started',
    'Step 5: Finalizing deployment',
    'Deployment Completed'
  ];

  // Render steps: completed, in progress, future
  let progressList = [];
  let foundInProgress = false;
  for (let i = 0; i < allSteps.length; i++) {
    if (i < completedLogs.length) {
      // Completed step
      progressList.push(<li key={i}>{allSteps[i]}</li>);
    } else if (!foundInProgress) {
      // First incomplete step is in progress, add loader
      progressList.push(
        <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <em>{allSteps[i].replace('Step', 'Step') + ' in progress'}</em>
          <Spin size="small" style={{ marginLeft: 8 }} />
        </li>
      );
      foundInProgress = true;
    } else {
      // Future steps
      progressList.push(<li key={i} style={{ color: '#bbb' }}>{allSteps[i]}</li>);
    }
  }

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
              <strong>Deployment Progress:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                {progressList}
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Report;