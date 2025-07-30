import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Form, Radio, Checkbox, Divider, Typography, Space, Tooltip, message, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const ipRegex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/;
const subnetRegex = /^(255|254|252|248|240|224|192|128|0+)\.((255|254|252|248|240|224|192|128|0+)\.){2}(255|254|252|248|240|224|192|128|0+)$/;

// Get the nodes from sessionStorage (as in Addnode.jsx)
function getLicenseNodes() {
  const saved = sessionStorage.getItem('cloud_licenseNodes');
  return saved ? JSON.parse(saved) : [];
}

const NetworkApply = () => {
  const [licenseNodes, setLicenseNodes] = useState(getLicenseNodes());
  const [loading, setLoading] = useState(false);
  // Restore forms from sessionStorage if available
  const getInitialForms = () => {
    const saved = sessionStorage.getItem('cloud_networkApplyForms');
    if (saved) return JSON.parse(saved);
    return licenseNodes.map(node => ({
      ip: node.ip,
      configType: 'default',
      useBond: false,
      tableData: generateRows('default', false),
    }));
  };
  const [forms, setForms] = useState(getInitialForms);

  // If licenseNodes changes (e.g. after license activation), reset forms
  useEffect(() => {
    setForms(
      licenseNodes.map(node => ({
        ip: node.ip,
        configType: 'default',
        useBond: false,
        tableData: generateRows('default', false),
      }))
    );
  }, [licenseNodes]);

  // Persist forms to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('cloud_networkApplyForms', JSON.stringify(forms));
  }, [forms]);

  function generateRows(configType, useBond) {
    const count = configType === 'default' ? 2 : 4;
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      ip: '',
      subnet: '',
      dns: '',
      gateway: '',
      interface: useBond ? [] : '',
      bondName: '',
      vlanId: '',
      type: configType === 'default' ? '' : [],
      errors: {},
    }));
  }

  const handleConfigTypeChange = (idx, value) => {
    setForms(prev => prev.map((f, i) => i === idx ? {
      ...f,
      configType: value,
      tableData: generateRows(value, f.useBond)
    } : f));
  };
  const handleUseBondChange = (idx, checked) => {
    setForms(prev => prev.map((f, i) => i === idx ? {
      ...f,
      useBond: checked,
      tableData: generateRows(f.configType, checked)
    } : f));
  };
  const handleCellChange = (nodeIdx, rowIdx, field, value) => {
    setForms(prev => prev.map((f, i) => {
      if (i !== nodeIdx) return f;
      const updated = [...f.tableData];
      const row = { ...updated[rowIdx] };
      if (!row.errors) row.errors = {};
      row[field] = value;
      // Validation logic (IP, subnet, etc.)
      if (["ip", "dns", "gateway"].includes(field)) {
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
      updated[rowIdx] = row;
      return { ...f, tableData: updated };
    }));
  };

  const getColumns = (form, nodeIdx) => {
    const baseColumns = [
      {
        title: 'SL.NO',
        key: 'slno',
        render: (_, __, index) => <span>{index + 1}</span>,
      },
    ];
    const bondColumn = {
      title: 'Bond Name',
      dataIndex: 'bondName',
      render: (_, record, rowIdx) => (
        <Input
          value={record.bondName ?? ''}
          placeholder="Enter Bond Name"
          onChange={e => handleCellChange(nodeIdx, rowIdx, 'bondName', e.target.value)}
        />
      ),
    };
    const vlanColumn = {
      title: 'VLAN ID',
      dataIndex: 'vlanId',
      render: (_, record, rowIdx) => (
        <Input
          value={record.vlanId ?? ''}
          placeholder="Enter VLAN ID (optional)"
          onChange={e => handleCellChange(nodeIdx, rowIdx, 'vlanId', e.target.value)}
        />
      ),
    };
    const mainColumns = [
      {
        title: 'Interfaces Required',
        dataIndex: 'interface',
        render: (_, record, rowIdx) => (
          <Input
            value={record.interface}
            placeholder={form.useBond ? 'Enter interfaces (comma separated)' : 'Enter interface'}
            onChange={e => handleCellChange(nodeIdx, rowIdx, 'interface', e.target.value)}
          />
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (_, record, rowIdx) => (
          <Select
            mode={form.configType === 'segregated' ? 'multiple' : undefined}
            allowClear
            style={{ width: '100%' }}
            value={record.type}
            placeholder="Select type"
            onChange={value => handleCellChange(nodeIdx, rowIdx, 'type', value)}
          >
            {form.configType === 'segregated' ? (
              <>
                <Option value="Management">Management</Option>
                <Option value="VXLAN">VXLAN</Option>
                <Option value="Storage">Storage</Option>
                <Option value="External Traffic">External Traffic</Option>
              </>
            ) : (
              <>
                <Option value="primary">Primary</Option>
                <Option value="secondary">Secondary</Option>
              </>
            )}
          </Select>
        ),
      },
      {
        title: 'IP ADDRESS',
        dataIndex: 'ip',
        render: (_, record, rowIdx) => (
          <Input
            value={record.ip}
            placeholder="Enter IP Address"
            onChange={e => handleCellChange(nodeIdx, rowIdx, 'ip', e.target.value)}
          />
        ),
      },
      {
        title: 'SUBNET MASK',
        dataIndex: 'subnet',
        render: (_, record, rowIdx) => (
          <Input
            value={record.subnet}
            placeholder="Enter Subnet"
            onChange={e => handleCellChange(nodeIdx, rowIdx, 'subnet', e.target.value)}
          />
        ),
      },
      {
        title: 'DNS Servers',
        dataIndex: 'dns',
        render: (_, record, rowIdx) => (
          <Input
            value={record.dns}
            placeholder="Enter Nameserver"
            onChange={e => handleCellChange(nodeIdx, rowIdx, 'dns', e.target.value)}
          />
        ),
      },
    ];
    return [
      ...baseColumns,
      ...(form.useBond ? [bondColumn] : []),
      ...mainColumns,
      ...[vlanColumn],
    ];
  };

  const handleSubmit = (nodeIdx) => {
    // Validate all rows for this node
    const form = forms[nodeIdx];
    for (let i = 0; i < form.tableData.length; i++) {
      const row = form.tableData[i];
      if (form.useBond && !row.bondName?.trim()) {
        message.error(`Row ${i + 1}: Please enter a Bond Name.`);
        return;
      }
      if (!row.type || (Array.isArray(row.type) && row.type.length === 0)) {
        message.error(`Row ${i + 1}: Please select a Type.`);
        return;
      }
      // Validate required fields
      for (const field of ['ip', 'subnet', 'dns']) {
        if (!row[field]) {
          message.error(`Row ${i + 1}: Please enter ${field.toUpperCase()}.`);
          return;
        }
      }
      if (Object.keys(row.errors || {}).length > 0) {
        message.error(`Row ${i + 1} contains invalid entries. Please fix them.`);
        return;
      }
    }
    // Submit logic here (API call or sessionStorage)
    message.success(`Network config for node ${form.ip} submitted!`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Network Apply</Typography.Title>
      <Divider />
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {forms.map((form, idx) => (
          <Card key={form.ip} title={`Node: ${form.ip}`} style={{ width: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <Radio.Group
                value={form.configType}
                onChange={e => handleConfigTypeChange(idx, e.target.value)}
              >
                <Radio value="default">Default</Radio>
                <Radio value="segregated">Segregated</Radio>
              </Radio.Group>
              <Checkbox
                checked={form.useBond}
                style={{ marginLeft: 24 }}
                onChange={e => handleUseBondChange(idx, e.target.checked)}
              >
                Bond
              </Checkbox>
            </div>
            <Table
              columns={getColumns(form, idx)}
              dataSource={form.tableData}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: true }}
            />
            <Divider />
            <Button type="primary" onClick={() => handleSubmit(idx)} style={{ width: '110px', display: 'flex', marginLeft: '88%' }} >
              Apply Change
            </Button>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default NetworkApply;
