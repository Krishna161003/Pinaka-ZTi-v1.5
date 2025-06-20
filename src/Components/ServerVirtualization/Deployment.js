import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
  Button,
  Checkbox,
  Divider,
  Flex,
  Input,
  Radio,
  Select,
  Table,
  Typography,
  Form,
  Space
} from 'antd';
import { HomeOutlined, CloudOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';

const { Option } = Select;
const ipRegex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/;
const subnetRegex = /^(255|254|252|248|240|224|192|128|0+)\.((255|254|252|248|240|224|192|128|0+)\.){2}(255|254|252|248|240|224|192|128|0+)$/;

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const Deployment = () => {
  const cloudName = getCloudNameFromMetadata();
  const [configType, setConfigType] = useState('default');
  const [tableData, setTableData] = useState([]);
  const [useVLAN, setUseVLAN] = useState(false);
  const [useBond, setUseBond] = useState(false);


  // Generate rows based on selected config type
  const generateRows = (count) =>
    Array.from({ length: count }, (_, i) => ({
      key: i,
      ip: '',
      subnet: '',
      dns: '',
      gateway: '',
      errors: {}
    }));


  // Update table rows when config type changes
  const getRowCount = () => {
    if (configType === 'default') {
      return useBond ? 2 : 2;
    } else if (configType === 'segregated') {
      return useBond ? 4 : 4;
    }
    return 2;
  };

  useEffect(() => {
    const rows = generateRows(getRowCount());
    setTableData(rows);
  }, [configType, useBond, useVLAN]);


  const handleReset = () => {
    setTableData(generateRows(getRowCount()));
  };
  const handleCellChange = (index, field, value) => {
    const updatedData = [...tableData];
    const row = updatedData[index];

    // Initialize errors if not present
    if (!row.errors) row.errors = {};

    // Assign value
    row[field] = value;

    // Validation
    if (['ip', 'dns', 'gateway'].includes(field)) {
      if (!ipRegex.test(value)) {
        row.errors[field] = 'Should be a valid address';
      } else {
        delete row.errors[field];
      }
    }

    if (field === 'subnet') {
      if (!subnetRegex.test(value)) {
        row.errors[field] = 'Invalid subnet format';
      } else {
        delete row.errors[field];
      }
    }

    if (field === 'interface' && useBond && value.length > 2) {
      value = value.slice(0, 2);
    }

    updatedData[index] = row;
    setTableData(updatedData);
  };

  const getColumns = () => {
    const baseColumns = [
      {
        title: 'SL.NO',
        key: 'slno',
        render: (_, record, index) => <span>{index + 1}</span>,
      },
    ];

    const bondColumn = {
      title: 'Bond Name',
      dataIndex: 'bondName',
      render: (_, record, index) => (
        <Input
          value={record.bondName ?? ''}
          placeholder="Enter Bond Name"
          onChange={(e) => handleCellChange(index, 'bondName', e.target.value)}
        />
      ),
    };

    const vlanColumn = {
      title: 'VLAN ID',
      dataIndex: 'vlanId',
      render: (_, record, index) => (
        <Input
          value={record.vlanId ?? ''}
          placeholder="Enter Vlan ID"
          onChange={(e) => handleCellChange(index, 'vlanId', e.target.value)}
        />
      ),
    };

    const mainColumns = [
      {
        title: 'Interfaces Required',
        dataIndex: 'interface',
        render: (_, record, index) => (
          <Select
            mode={useBond ? 'multiple' : undefined}
            style={{ width: '100%' }}
            value={record.interface}
            placeholder={useBond ? 'Select interfaces' : 'Select interface'}
            onChange={(value) => handleCellChange(index, 'interface', value)}
          >
            <Option value="eth0">eth0</Option>
            <Option value="eth1">eth1</Option>
          </Select>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (_, record, index) => (
          <Select
            mode={configType === 'segregated' ? 'multiple' : undefined}
            allowClear
            style={{ width: '100%' }}
            value={record.type}
            placeholder="Select type"
            onChange={(value) => handleCellChange(index, 'type', value)}
          >
            {configType === 'segregated' ? (
              <>
                <Option value="m">m</Option>
                <Option value="e">e</Option>
                <Option value="x">x</Option>
                <Option value="y">y</Option>
              </>
            ) : (
              <>
                <Option value="admin">Primary</Option>
                <Option value="data">Secondary</Option>
              </>
            )}
          </Select>
        ),
      },
      {
        title: 'IP ADDRESS',
        dataIndex: 'ip',
        render: (_, record, index) => (
          <Form.Item
            validateStatus={record.errors?.ip ? 'error' : ''}
            help={record.errors?.ip}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.ip}
              placeholder="Enter IP Address"
              onChange={(e) => handleCellChange(index, 'ip', e.target.value)}
            />
          </Form.Item>
        ),
      },
      {
        title: 'SUBNET MASK',
        dataIndex: 'subnet',
        render: (_, record, index) => (
          <Form.Item
            validateStatus={record.errors?.subnet ? 'error' : ''}
            help={record.errors?.subnet}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.subnet}
              placeholder="Enter Subnet"
              onChange={(e) => handleCellChange(index, 'subnet', e.target.value)}
            />
          </Form.Item>
        ),
      },
      {
        title: 'DNS Servers',
        dataIndex: 'dns',
        render: (_, record, index) => (
          <Form.Item
            validateStatus={record.errors?.dns ? 'error' : ''}
            help={record.errors?.dns}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.dns}
              placeholder="Enter Nameserver"
              onChange={(e) => handleCellChange(index, 'dns', e.target.value)}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Gateway',
        dataIndex: 'gateway',
        render: (_, record, index) => (
          <Form.Item
            validateStatus={record.errors?.gateway ? 'error' : ''}
            help={record.errors?.gateway}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.gateway}
              placeholder="Enter Gateway"
              onChange={(e) => handleCellChange(index, 'gateway', e.target.value)}
            />
          </Form.Item>
        ),
      },
    ];
    return [
      ...baseColumns,
      ...(useBond ? [bondColumn] : []),
      ...mainColumns,
      ...(useVLAN ? [vlanColumn] : []),
    ];
  };


  return (
    <div style={{ padding: "20px" }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.25%" }}>
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <Breadcrumb>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>Deployment Options</Breadcrumb.Item>
          <Breadcrumb.Item>Validation</Breadcrumb.Item>
          <Breadcrumb.Item>System Interfaces</Breadcrumb.Item>
          <Breadcrumb.Item>License Activation</Breadcrumb.Item>
          <Breadcrumb.Item>Deployment</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Divider />
      <h4 style={{ userSelect: "none" }}>Network Configuration</h4>
      <Splitter
        style={{
          height: 150,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Splitter.Panel size="50%" resizable={false}>
          <div style={{ padding: 20 }}>
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              Configuration Type
            </Typography.Title>
            <Radio.Group
              value={configType}
              onChange={(e) => setConfigType(e.target.value)}
            >
              <Flex vertical gap="small">
                <Radio value="default">Default</Radio>
                <Radio value="segregated">Segregated</Radio>
              </Flex>
            </Radio.Group>
          </div>
        </Splitter.Panel>

        <Splitter.Panel resizable={false}>
          <div style={{ padding: 20 }}>
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              Advanced Networking Options
            </Typography.Title>
            <Flex vertical gap="small">
              <Checkbox checked={useVLAN} onChange={(e) => setUseVLAN(e.target.checked)}>VLAN</Checkbox>
              <Checkbox checked={useBond} onChange={(e) => setUseBond(e.target.checked)}>BOND</Checkbox>
            </Flex>
          </div>
        </Splitter.Panel>
      </Splitter>

      <Flex justify="flex-end" style={{ margin: '16px 0' }}>
        <Button type="text" danger onClick={handleReset} style={{ width: "100px", height: "35px" }}>
          Reset Table
        </Button>
      </Flex>

      <div style={{ marginTop: 24 }}>
        <Table
          columns={getColumns()}  // ← dynamic columns logic goes here
          dataSource={tableData}
          pagination={false}
          bordered
          size="small"
        />
      </div>
      <Divider />
      <div style={{ display: "flex", marginTop: "20px", gap: "7px" }}>
        <h4 style={{ userSelect: "none" }}>Provider Network</h4>
        <p style={{ marginTop: "4px" }}>(optional)</p>
      </div>

      <Form>
        <Space>
          <div style={{ display: "flex", gap: "40px" }}>
            <Form.Item
              name="cidr"
              rules={[
                // {
                //   required: true,
                //   message: 'CIDR is required',
                // },
                {
                  pattern: /^(([0-9]{1,3}\.){3}[0-9]{1,3})\/([0-9]|[1-2][0-9]|3[0-2])$/,
                  message: 'Invalid CIDR format (e.g. 192.168.1.0/24)',
                },
              ]}
            >
              <Input placeholder="Enter CIDR" style={{ width: 200 }} />
            </Form.Item>

            <Form.Item
              name="gateway"
              rules={[
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid IP address',
                },
              ]}
            >
              <Input placeholder="Enter Gateway" style={{ width: 200 }} />
            </Form.Item>

            <Form.Item
              name="startingIp"
              rules={[
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid IP address',
                },
              ]}
            >
              <Input placeholder="Enter Starting IP" style={{ width: 200 }} />
            </Form.Item>

            <Form.Item
              name="endingIp"
              rules={[
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid IP address',
                },
              ]}
            >
              <Input placeholder="Enter Ending IP" style={{ width: 200 }} />
            </Form.Item>
          </div>
        </Space>
      </Form >
      <Divider />
      <div style={{ display: "flex", marginTop: "20px", gap: "7px" }}>
        <h4 style={{ userSelect: "none" }}>Tenant Network</h4>
        <p style={{ marginTop: "4px" }}>(optional)</p>
      </div>
      <Form layout="vertical">
        <Space>
          <div style={{ display: "flex", gap: "40px" }}>
            {/* CIDR Field */}
            <Form.Item
              name="cidr"
              rules={[
                // { required: true, message: 'CIDR is required' },
                {
                  pattern: /^(([0-9]{1,3}\.){3}[0-9]{1,3})\/([0-9]|[1-2][0-9]|3[0-2])$/,
                  message: 'Invalid CIDR format (e.g. 10.0.0.0/24)',
                },
              ]}
            >
              <Input
                placeholder="CIDR default:10.0.0.0/24"
                style={{ width: 200 }}
              />
            </Form.Item>

            {/* Gateway Field */}
            <Form.Item
              name="gateway"
              rules={[
                // { required: true, message: 'Gateway is required' },
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid Gateway IP (e.g. 10.0.0.1)',
                },
              ]}
            >
              <Input
                placeholder="Gateway default:10.0.0.1"
                style={{ width: 200 }}
              />
            </Form.Item>

            {/* Nameserver Field */}
            <Form.Item
              name="nameserver"
              rules={[
                // { required: true, message: 'Nameserver is required' },
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid Nameserver IP (e.g. 8.8.8.8)',
                },
              ]}
            >
              <Input
                placeholder="Nameserver default:8.8.8.8"
                style={{ width: 200 }}
              />
            </Form.Item>
          </div>
        </Space>
      </Form>
      <Flex justify="flex-end">
        <Space>
          <Button htmlType="button" danger >
            Reset Values
          </Button>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Space>
      </Flex>
    </div >
  );
};

export default Deployment;
