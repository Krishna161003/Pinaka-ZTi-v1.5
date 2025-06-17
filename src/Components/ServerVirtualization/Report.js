import React, { useEffect, useState } from 'react';
import { Breadcrumb, Card, Spin, Alert } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : 'Default Cloud'; // Default value if not found
};

const hostIP = process.env.REACT_APP_HOST_IP; //retrive host ip

const Report = ({ ibn }) => {
  const [urls, setUrls] = useState(null); // State to store the URLs
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const cloudName = getCloudNameFromMetadata();

  // Fetch URLs from the backend API when `ibn` changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true when starting the fetch

      try {
        // Check if ibn is available
        if (!ibn) {
          setError('IBN is missing. Please go back and select a valid IBN.');
          setLoading(false);
          return;
        }

        // Fetch the credentials from the backend API using `ibn`
        const response = await fetch(`https://${hostIP}:9909/api/credentials`, {
          headers: { 'ibn': ibn } // Pass the `ibn` value in the request headers
        });

        if (!response.ok) {
          throw new Error('Error fetching data');
        }

        const data = await response.json();
        setUrls(data); // Set the fetched URLs data to the state
        setLoading(false); // Set loading to false when data is fetched
      } catch (error) {
        setError('Error fetching data: ' + error.message);
        setLoading(false); // Stop loading on error
      }
    };

    if (ibn) {
      fetchData(); // Call the fetch data function if `ibn` is provided
    }
  }, [ibn]); // Run the effect when `ibn` changes

  // Loading state while data is being fetched
  if (loading) {
    return <Spin size="large" tip="Loading data..." style={{ marginTop: '20px' }} />;
  }

  // Error state if fetching fails
  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ marginTop: '20px' }}
      />
    );
  }

  // Render the report card when data is successfully fetched
  return (
    <div style={{ padding: '20px' }}>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item><HomeOutlined /></Breadcrumb.Item>
        <Breadcrumb.Item>Deployment</Breadcrumb.Item>
        <Breadcrumb.Item>Discovery</Breadcrumb.Item>
        <Breadcrumb.Item>Validation</Breadcrumb.Item>
        <Breadcrumb.Item>Report</Breadcrumb.Item>
      </Breadcrumb>

      <div>
        <h4>Deployment Summary</h4>
      </div>
      <div style={{ paddingTop: '20px' }}>
        <Card
          title={`${cloudName} Cloud`}
          bordered={false}
          style={{
            width: 800,
            height: 200,
            boxShadow: '1px 4px 16px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
        >
          {urls ? (
            <>
              <p><b>Skyline Dashboard :</b> <a href={urls.skylineDashboardUrl} target="_blank" rel="noopener noreferrer">{urls.skylineDashboardUrl}</a></p>
              <p><b>Ceph Dashboard &nbsp;&nbsp; :</b> <a href={urls.cephDashboardUrl} target="_blank" rel="noopener noreferrer">{urls.cephDashboardUrl}</a></p>
            </>
          ) : (
            <p>No URLs available.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Report;
