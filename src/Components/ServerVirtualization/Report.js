import React, { useEffect, useState, useRef } from 'react';
import { Divider, Card, Progress, Row, Col, Flex, Spin } from 'antd';
import { CloudOutlined } from '@ant-design/icons';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : 'Default';
};

const hostIP = window.location.hostname;

const Report = () => {
  const [completionWindowActive, setCompletionWindowActive] = useState(false);
  const completionWindowTimeoutRef = useRef(null);
  const revertedRef = useRef(false);
  const cloudName = getCloudNameFromMetadata();
  const [percent, setPercent] = useState(0);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [error, setError] = useState(null);

  // Track serverid for this deployment
  const serveridRef = React.useRef(sessionStorage.getItem('currentServerid') || null);

  useEffect(() => {
    let isMounted = true;
    let completedTime = null;
    let stopTimeout = null;
    let interval = null;

    // --- Prevent duplicate DB logs on reload/login ---
    const loginDetails = JSON.parse(sessionStorage.getItem('loginDetails'));
    const userData = loginDetails?.data;
    const user_id = userData?.id;

    // Check for in-progress deployment and set serveridRef/sessionStorage if needed
    const checkInProgress = async () => {
      if (!user_id) return;
      try {
        const res = await fetch(`https://${hostIP}:5000/api/deployment-activity-log/latest-in-progress/${user_id}`);
        const data = await res.json();
        if (data.inProgress && data.log?.serverid) {
          serveridRef.current = data.log.serverid;
          sessionStorage.setItem('currentServerid', data.log.serverid);
        }
      } catch (e) {
        // Optionally handle error
      }
    };

    // Helper to log deployment start
    const logDeploymentStart = async () => {
      const loginDetails = JSON.parse(sessionStorage.getItem('loginDetails'));
      const userData = loginDetails?.data;
      const user_id = userData?.id;
      const username = userData?.companyName;
      if (!user_id || !username || !cloudName || !hostIP) {
        console.warn('Missing required fields for deployment log', { user_id, username, cloudName, hostIP });
        return;
      }
      if (serveridRef.current) {
        console.warn('serveridRef.current already set, skipping log');
        return;
      }
      try {
        console.log('POSTing deployment activity log', { user_id, username, cloudName, hostIP });
        const res = await fetch(`https://${hostIP}:5000/api/deployment-activity-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id,
            username,
            cloudname: cloudName,
            serverip: hostIP,
            license_code: JSON.parse(sessionStorage.getItem('licenseStatus'))?.license_code || null,
            license_type: JSON.parse(sessionStorage.getItem('licenseStatus'))?.type || null,
            license_period: JSON.parse(sessionStorage.getItem('licenseStatus'))?.period || null,
            vip: sessionStorage.getItem('vip') || null
          })
        });
        const data = await res.json();
        console.log('Deployment activity log response:', data);
        if (data.serverid) {
          serveridRef.current = data.serverid;
          sessionStorage.setItem('currentServerid', data.serverid);
        }
      } catch (e) {
        console.error('Error sending deployment log:', e);
      }
    };

    // Debug: Log each time fetchProgress runs and the percent value
    const debugFetchProgress = (data) => {
      console.log('fetchProgress polled:', {
        percent: data.percent,
        completed_steps: data.completed_steps,
        serveridRef: serveridRef.current,
        sessionStorageServerid: sessionStorage.getItem('currentServerid')
      });
    };

    // Helper to mark deployment as completed
    const logDeploymentComplete = async () => {
      if (!serveridRef.current) return;
      try {
        // Mark as completed
        await fetch(`https://${hostIP}:5000/api/deployment-activity-log/${serveridRef.current}`, {
          method: 'PATCH'
        });
        
        // Finalize deployment (transfer to appropriate table)
        // Determine server_type based on deployment type or user selection
        const server_type = 'host'; // Default to 'host', you can modify this logic
        
        await fetch(`https://${hostIP}:5000/api/finalize-deployment/${serveridRef.current}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_type,
            license_code: JSON.parse(sessionStorage.getItem('licenseStatus'))?.license_code || null,
            role: server_type === 'host' ? 'master' : 'worker',
            host_serverid: server_type === 'child' ? 'parent-host-id' : null // Only needed for child nodes
          })
        });
        
        console.log(`Deployment finalized as ${server_type}`);
        sessionStorage.removeItem('currentServerid');
      } catch (e) {
        console.error('Error completing deployment:', e);
      }
    };


    // Helper to revert status to progress if needed
    const revertToProgress = async () => {
      if (!serveridRef.current) return;
      try {
        await fetch(`https://${hostIP}:5000/api/deployment-activity-log/${serveridRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'progress' })
        });
        revertedRef.current = true;
        console.log('Deployment status reverted to progress due to drop in percent.');
      } catch (e) {
        console.error('Failed to revert deployment status:', e);
      }
    };


    const fetchProgress = async () => {
      try {
        const res = await fetch(`https://${hostIP}:2020/deployment-progress`);
        if (isMounted) {
          if (res.ok) {
            const data = await res.json();
            setPercent(data.percent || 0);
            setCompletedLogs(data.completed_steps || []);
            setError(null);

            debugFetchProgress(data);

            // Log deployment start in DB if just started
            if ((data.percent || 0) > 0 && !serveridRef.current) {
              await logDeploymentStart();
            }
            // Log deployment completion in DB if just completed
            if ((data.percent || 0) === 100 && serveridRef.current) {
              await logDeploymentComplete();
            }

            // Start 3-min window after deployment completes
            if ((data.percent || 0) === 100 && !completedTime) {
              completedTime = Date.now();
              setCompletionWindowActive(true);
              revertedRef.current = false;
              if (completionWindowTimeoutRef.current) clearTimeout(completionWindowTimeoutRef.current);
              completionWindowTimeoutRef.current = setTimeout(() => {
                setCompletionWindowActive(false);
                revertedRef.current = false;
              }, 180000); // 3 minutes
              // Set a timeout to stop polling after 5 minutes (as before)
              stopTimeout = setTimeout(() => {
                if (interval) clearInterval(interval);
              }, 300000); // 5 minutes
            }

            // If in the 3-min window and percent drops below 100, revert status
            if (
              completionWindowActive &&
              (data.percent || 0) < 100 &&
              !revertedRef.current &&
              serveridRef.current
            ) {
              revertToProgress();
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
    // First, check for in-progress deployment, then start polling
    checkInProgress().then(() => {
      fetchProgress();
      interval = setInterval(fetchProgress, 2000);
    });
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (stopTimeout) clearTimeout(stopTimeout);
      if (completionWindowTimeoutRef.current) clearTimeout(completionWindowTimeoutRef.current);
    };
  }, [cloudName]);

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