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
} from 'antd';
import { HomeOutlined, CloudOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';

const { Option } = Select;


const Deployment = () => {
  const cloudName = "Example"; // Replace with getCloudNameFromMetadata() if needed

  const [configType, setConfigType] = useState('default');
  const [tableData, setTableData] = useState([]);
  const [useVLAN, setUseVLAN] = useState(false);
  const [useBond, setUseBond] = useState(false);


  // Generate rows based on selected config type
  const generateRows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      key: i,
      ip: '',
      subnet: '',
      dns: '',
      gateway: '',
    }));

  // Update table rows when config type changes
  useEffect(() => {
    const rows = generateRows(getRowCount());
    setTableData(rows);
  }, [configType, useBond, useVLAN]);

  const getRowCount = () => {
    if (configType === 'default') {
      if (useBond) return 4;
      return 2;
    } else if (configType === 'segregated') {
      if (useBond) return 8;
      return 4;
    }
    return 2; // fallback
  };
  
  const handleReset = () => {
    setTableData(generateRows(getRowCount()));
  };

  const handleCellChange = (index: number, field: string, value: any) => {
    const updatedData = [...tableData];
    updatedData[index][field] = value;
    setTableData(updatedData);
  };



  const getColumns = () => {
    const baseColumns = [
      {
        title: 'SL.NO',
        key: 'slno',
        render: (_: any, __: any, index: number) => <span>{index + 1}</span>,
      },
    ];

    const bondColumn = {
      title: 'Bond Name',
      dataIndex: 'bondName',
      render: (_: any, record: any, index: number) => (
        <Input
          value={record.bondName}
          onChange={(e) => handleCellChange(index, 'bondName', e.target.value)}
        />
      ),
    };

    const vlanColumn = {
      title: 'VLAN ID',
      dataIndex: 'vlanId',
      render: (_: any, record: any, index: number) => (
        <Input
          value={record.vlanId}
          onChange={(e) => handleCellChange(index, 'vlanId', e.target.value)}
        />
      ),
    };

    const mainColumns = [
      {
        title: 'Interfaces Required',
        dataIndex: 'interface',
        render: (_: any, record: any, index: number) => (
          <Select
            style={{ width: '100%' }}
            value={record.interface}
            onChange={(value) => handleCellChange(index, 'interface', value)}
          >
            <Option value="eth0">eth0</Option>
            <Option value="eth1">eth1</Option>
          </Select>
        ),
      },
      {
        title: 'Roles',
        dataIndex: 'roles',
        render: (_: any, record: any, index: number) => (
          <Select
            style={{ width: '100%' }}
            value={record.roles}
            onChange={(value) => handleCellChange(index, 'roles', value)}
          >
            <Option value="admin">Admin</Option>
            <Option value="data">Data</Option>
          </Select>
        ),
      },
      {
        title: 'IP ADDRESS',
        dataIndex: 'ip',
        render: (_: any, record: any, index: number) => (
          <Input
            value={record.ip}
            onChange={(e) => handleCellChange(index, 'ip', e.target.value)}
          />
        ),
      },
      {
        title: 'SUBNET MASK',
        dataIndex: 'subnet',
        render: (_: any, record: any, index: number) => (
          <Input
            value={record.subnet}
            onChange={(e) => handleCellChange(index, 'subnet', e.target.value)}
          />
        ),
      },
      {
        title: 'DNS Servers',
        dataIndex: 'dns',
        render: (_: any, record: any, index: number) => (
          <Input
            value={record.dns}
            onChange={(e) => handleCellChange(index, 'dns', e.target.value)}
          />
        ),
      },
      {
        title: 'Gateway',
        dataIndex: 'gateway',
        render: (_: any, record: any, index: number) => (
          <Input
            value={record.gateway}
            onChange={(e) => handleCellChange(index, 'gateway', e.target.value)}
          />
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
    </div>
  );
};

export default Deployment;
