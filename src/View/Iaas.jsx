import React, { useState, useEffect } from 'react';
import Layout1 from '../Components/layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { theme, Layout, Tabs, Table, Button, Modal, Spin, Alert, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// LicenseDetailsModalContent: fetches and displays license details for a serverid
function LicenseDetailsModalContent({ serverid }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [license, setLicense] = useState(null);

  useEffect(() => {
    if (!serverid) return;
    setLoading(true);
    setError(null);
    setLicense(null);
    fetch(`https://${hostIP}:5000/api/license-details/${serverid}`)
      .then(res => {
        if (!res.ok) throw new Error('No license found');
        return res.json();
      })
      .then(setLicense)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [serverid]);

  if (!serverid) return <div style={{color:'#aaa'}}>No server ID selected.</div>;
  if (loading) return <Spin tip="Loading license details..." />;
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!license) return <div style={{color:'#aaa'}}>No license data found.</div>;
  return (
    <div>
      <div><b>License Code:</b> {license.license_code || <span style={{ color: '#aaa' }}>-</span>}</div>
      <div><b>Type:</b> {license.license_type || <span style={{ color: '#aaa' }}>-</span>}</div>
      <div><b>Period:</b> {license.license_period || <span style={{ color: '#aaa' }}>-</span>}</div>
      <div><b>Status:</b> {license.license_status || <span style={{ color: '#aaa' }}>-</span>}</div>
    </div>
  );
}

const { Content } = Layout;
const hostIP=window.location.hostname;

// Helper for column search (AntD Table)
function getColumnSearchProps(dataIndex, placeholder) {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${placeholder || dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={confirm}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={confirm}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : false,
  };
}

const FlightDeckHostsTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);

  useEffect(() => {
    setLoading(true);
    const userId = JSON.parse(sessionStorage.getItem('loginDetails'))?.data?.id;
    fetch(`https://${hostIP}:5000/api/flight-deck-hosts?userId=${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'S.NO',
      dataIndex: 'sno',
      key: 'sno',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.sno - b.sno,
    },
    {
      title: 'Serverid',
      dataIndex: 'serverid',
      key: 'serverid',
      width: 210,
      ellipsis: true,
      align: 'center',
      ...getColumnSearchProps('serverid', 'Server ID'),
      sorter: (a, b) => a.serverid.localeCompare(b.serverid),
    },
    {
      title: 'Serverip',
      dataIndex: 'serverip',
      key: 'serverip',
      width: 120,
      align: 'center',
      ...getColumnSearchProps('serverip', 'Server IP'),
      sorter: (a, b) => a.serverip.localeCompare(b.serverip),
    },
    {
      title: 'VIP',
      dataIndex: 'vip',
      key: 'vip',
      width: 120,
      align: 'center',
      ...getColumnSearchProps('vip', 'VIP'),
      sorter: (a, b) => (a.vip || '').localeCompare(b.vip || ''),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center',
      ...getColumnSearchProps('role', 'Role'),
      sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
    },
    {
      title: 'License Code',
      dataIndex: 'licensecode',
      key: 'licensecode',
      width: 140,
      align: 'center',
      ...getColumnSearchProps('licensecode', 'License Code'),
      sorter: (a, b) => (a.licensecode || '').localeCompare(b.licensecode || ''),
      render: val => val ? val : <span style={{ color: '#aaa' }}>-</span>
    },
    {
      title: 'Squadron Node',
      dataIndex: 'squadronNode',
      key: 'squadronNode',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.squadronNode - b.squadronNode,
    },
    {
      title: 'Credential',
      key: 'credential',
      align: 'center',
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => {
          setModalRecord(record);
          setModalVisible('credential');
        }} type='primary' style={{ width: '95px' }}>
          View
        </Button>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: val => val ? new Date(val).toISOString().slice(0,10) : '',
      width: 120,
      align: 'center',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    }
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Spin spinning={loading} tip="Loading Flight Deck Hosts...">
        <Table
          columns={columns}
          dataSource={data}
          rowKey={row => row.sno + '-' + row.serverid}
          pagination={false}
          bordered
          size="middle"
        />
      </Spin>
      {/* Credential Modal */}
      <Modal
        open={modalVisible === 'credential'}
        onCancel={() => setModalVisible(null)}
        title="Host Credentials"
        footer={<Button onClick={() => setModalVisible(null)}>Close</Button>}
        width={600}
      >
        <div>
          <b>1. Flight Deck</b>
          <ul style={{ marginBottom: 8 }}>
            <li>{modalRecord?.credentialsUrl ? (
              <a href={modalRecord.credentialsUrl} target="_blank" rel="noopener noreferrer">
                {modalRecord.credentialsUrl}
              </a>
            ) : <span>No URL</span>}</li>
          </ul>
          <b>2. Storage</b>
          <ul style={{ marginBottom: 8 }}>
            <li>{modalRecord?.serverip ? (
              <a href={`https://${modalRecord.serverip}:8443/`} target="_blank" rel="noopener noreferrer">
                https://{modalRecord.serverip}:8443/
              </a>
            ) : <span>No URL</span>}</li>
          </ul>
          <b>3. Monitoring</b>
          <ul style={{ marginBottom: 8 }}>
            <li>{modalRecord?.vip ? (
              <a href={`https://${modalRecord.vip}:7000/`} target="_blank" rel="noopener noreferrer">
                https://{modalRecord.vip}:7000/
              </a>
            ) : modalRecord?.serverip ? (
              <a href={`https://${modalRecord.serverip}:7000/`} target="_blank" rel="noopener noreferrer">
                https://{modalRecord.serverip}:7000/
              </a>
            ) : <span>No URL</span>}</li>
          </ul>
          <b>4. Diagnosis Dashboard</b>
          <ul style={{ marginBottom: 0 }}>
            <li>{modalRecord?.vip ? (
              <a href={`https://${modalRecord.vip}:5601/`} target="_blank" rel="noopener noreferrer">
                https://{modalRecord.vip}:5601/
              </a>
            ) : modalRecord?.serverip ? (
              <a href={`https://${modalRecord.serverip}:5601/`} target="_blank" rel="noopener noreferrer">
                https://{modalRecord.serverip}:5601/
              </a>
            ) : <span>No URL</span>}</li>
          </ul>
        </div>
      </Modal>
      {/* License Modal */}
      <Modal
        open={modalVisible === 'license'}
        onCancel={() => setModalVisible(null)}
        title="License Details"
        footer={<Button onClick={() => setModalVisible(null)}>Close</Button>}
      >
        <div>
          <div><b>License Code:</b> {modalRecord?.licensecode || <span style={{ color: '#aaa' }}>-</span>}</div>
          {modalRecord?.licenseType && <div><b>Type:</b> {modalRecord.licenseType}</div>}
          {modalRecord?.licensePeriod && <div><b>Period:</b> {modalRecord.licensePeriod}</div>}
          {/* Add more license fields if available */}
        </div>
      </Modal>
    </div>
  );
};

const SquadronNodesTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);

  useEffect(() => {
    setLoading(true);
    const userId = JSON.parse(sessionStorage.getItem('loginDetails'))?.data?.id;
    fetch(`https://${hostIP}:5000/api/squadron-nodes?userId=${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'S.NO',
      dataIndex: 'sno',
      key: 'sno',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.sno - b.sno,
    },
    {
      title: 'Server ID',
      dataIndex: 'serverid',
      key: 'serverid',
      width: 210,
      ellipsis: true,
      align: 'center',
      ...getColumnSearchProps('serverid', 'Server ID'),
      sorter: (a, b) => a.serverid.localeCompare(b.serverid),
    },
    {
      title: 'Server IP',
      dataIndex: 'serverip',
      key: 'serverip',
      width: 120,
      align: 'center',
      ...getColumnSearchProps('serverip', 'Server IP'),
      sorter: (a, b) => a.serverip.localeCompare(b.serverip),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center',
      ...getColumnSearchProps('role', 'Role'),
      sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
    },
    {
      title: 'License Code',
      dataIndex: 'licensecode',
      key: 'licensecode',
      width: 140,
      align: 'center',
      ...getColumnSearchProps('licensecode', 'License Code'),
      sorter: (a, b) => (a.licensecode || '').localeCompare(b.licensecode || ''),
      render: val => val ? val : <span style={{ color: '#aaa' }}>-</span>
    },
    {
      title: 'Credential',
      key: 'credential',
      align: 'center',
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => {
          setModalRecord(record);
          setModalVisible('credential');
        }} type='primary' style={{ width: '95px' }}>
          View
        </Button>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: val => val ? new Date(val).toISOString().slice(0,10) : '',
      width: 120,
      align: 'center',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    }
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Spin spinning={loading} tip="Loading Squadron Nodes...">
        <Table
          columns={columns}
          dataSource={data}
          rowKey={row => row.sno + '-' + row.serverid}
          pagination={false}
          bordered
          size="middle"
        />
      </Spin>
      {/* Credential Modal */}
      <Modal
        open={modalVisible === 'credential'}
        onCancel={() => setModalVisible(null)}
        title="Squadron Node Credentials"
        footer={<Button onClick={() => setModalVisible(null)}>Close</Button>}
        width={600}
      >
        <LicenseDetailsModalContent serverid={modalRecord?.serverid} />
      </Modal>
      {/* License Modal */}
      <Modal
        open={modalVisible === 'license'}
        onCancel={() => setModalVisible(null)}
        title="License Details"
        footer={<Button onClick={() => setModalVisible(null)}>Close</Button>}
      >
        <div>
          <div><b>License Code:</b> {modalRecord?.licensecode || <span style={{ color: '#aaa' }}>-</span>}</div>
          {modalRecord?.licenseType && <div><b>Type:</b> {modalRecord.licenseType}</div>}
          {modalRecord?.licensePeriod && <div><b>Period:</b> {modalRecord.licensePeriod}</div>}
          {/* Add more license fields if available */}
        </div>
      </Modal>
    </div>
  );
};

const CloudDeploymentsTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCredentials, setModalCredentials] = useState({});

  useEffect(() => {
    setLoading(true);
    const userId = JSON.parse(sessionStorage.getItem('loginDetails'))?.data?.id;
    fetch(`https://${hostIP}:5000/api/cloud-deployments-summary?userId=${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'S.NO',
      dataIndex: 'sno',
      key: 'sno',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.sno - b.sno,
    },
    {
      title: 'Cloud Name',
      dataIndex: 'cloudName',
      key: 'cloudName',
      ...getColumnSearchProps('cloudName', 'Cloud Name'),
      sorter: (a, b) => a.cloudName.localeCompare(b.cloudName),
    },
    {
      title: 'Number of Nodes',
      dataIndex: 'numberOfNodes',
      key: 'numberOfNodes',
      align: 'center',
      sorter: (a, b) => a.numberOfNodes - b.numberOfNodes,
    },
    {
      title: 'Credentials',
      key: 'credentials',
      align: 'center',
      render: (_, record) => (
        <Button size="small" onClick={() => {
          setModalCredentials(record.credentials);
          setModalVisible(true);
        }} type='primary' style={{ width: '95px' }}>
          View
        </Button>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: val => val ? new Date(val).toISOString().slice(0,10) : '',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    }
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Spin spinning={loading} tip="Loading Cloud Deployments...">
        <Table
          columns={columns}
          dataSource={data}
          rowKey={row => row.sno + '-' + row.cloudName}
          pagination={false}
          bordered
          size="middle"
        />
      </Spin>
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        title="Cloud Credentials"
        footer={<Button onClick={() => setModalVisible(false)}>Close</Button>}
      >

        <div>
          <b>1. Cloud</b>
          <ul style={{ marginBottom: 8 }}>
            <li>Flight Deck - {modalCredentials.hostservervip && (
              <a href={`https://${modalCredentials.hostservervip}/`} target="_blank" rel="noopener noreferrer">
                https://{modalCredentials.hostservervip}/
              </a>
            )}
            </li>
          </ul>
          <b>2. Storage</b>
          <ul style={{ marginBottom: 8 }}>
            <li>Ceph - {modalCredentials.hostserverip && (
              <a href={`https://${modalCredentials.hostserverip}:8443/`} target="_blank" rel="noopener noreferrer">
                https://{modalCredentials.hostserverip}:8443/
              </a>
            )}
            </li>
          </ul>
          <b>3. Monitoring</b>
          <ul style={{ marginBottom: 8 }}>
            <li>Grafana - {modalCredentials.hostservervip && (
              <a href={`https://${modalCredentials.hostservervip}:7000/`} target="_blank" rel="noopener noreferrer">
                https://{modalCredentials.hostservervip}:7000/
              </a>
            )}
            </li>
          </ul>
          <b>4. Diagnosis Dashboard</b>
          <ul style={{ marginBottom: 0 }}>
            <li>Opensearch - {modalCredentials.hostservervip && (
              <a href={`https://${modalCredentials.hostservervip}:5601/`} target="_blank" rel="noopener noreferrer">
                https://{modalCredentials.hostservervip}:5601/
              </a>
            )}
            </li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

const Iaas = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Always use tab from URL as the single source of truth
  const getTabFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || '1';
  };
  const [activeTab, setActiveTab] = useState(getTabFromURL);

  // Sync state from URL
  useEffect(() => {
    const tabParam = getTabFromURL();
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // Save menu memory on unmount
    return () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || activeTab;
      const pathWithTab = `/iaas?tab=${tabParam}`;
      sessionStorage.setItem('lastIaasPath', pathWithTab);
      sessionStorage.setItem('lastMenuPath', pathWithTab);
    };
  }, [location.search, activeTab]);

  // Sync URL and sessionStorage from state (only on tab change)
  const onTabChange = (key) => {
    if (key !== activeTab) {
      setActiveTab(key);
      const params = new URLSearchParams(window.location.search);
      params.set('tab', key);
      navigate({ search: params.toString() }, { replace: true });
      sessionStorage.setItem('iaas_activeTab', key);
    }
  };


  // On mount, save last visited menu path
  useEffect(() => {
    sessionStorage.setItem("lastMenuPath", window.location.pathname + window.location.search);
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
            <div style={{ width: '100%' }}>
              <Tabs
                activeKey={activeTab}
                onChange={onTabChange}
                style={{ width: '100%' }}
                tabBarStyle={{ width: '100%' }}
                moreIcon={null}
                items={[
                  {
                    label: <span style={{ width: '100%', display: 'block', textAlign: 'center' }}>Cloud</span>,
                    key: '1',
                    children: (<CloudDeploymentsTable />)
                  },
                  {
                    label: <span style={{ width: '100%', display: 'block', textAlign: 'center' }}>Flight Deck</span>,
                    key: '2',
                    children: (<FlightDeckHostsTable />)
                  },
                  {
                    label: <span style={{ width: '100%', display: 'block', textAlign: 'center' }}>Squadron</span>,
                    key: '3',
                    children: (<SquadronNodesTable />)
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
                /* Fix: Make the highlight/ink bar always full width */
                .ant-tabs-ink-bar {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout1>
  );
};

export default Iaas;
