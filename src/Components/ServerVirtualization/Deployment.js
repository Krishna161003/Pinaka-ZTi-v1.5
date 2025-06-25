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
  Space,
  Tooltip,
  message
} from 'antd';
import { HomeOutlined, CloudOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Splitter } from 'antd';

const hostIP = window.location.hostname;
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
  const [Providerform] = Form.useForm();
  const [Tenantform] = Form.useForm();
  const [vipform] = Form.useForm();

  const shouldDisableFields = (record) =>
    configType === 'default' && record.type === 'secondary';


  const handleSubmit = async () => {
    try {
      // 1. Validate VIP form
      const vipValues = await vipform.validateFields();

      if (configType === 'segregated' && !vipValues.defaultGateway) {
        message.error('Default Gateway is required in segregated mode.');
        return;
      }

      // 2. Validate Table Rows
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];

        // Enforce interface selection
        if (!row.interface || (useBond && row.interface.length !== 2)) {
          message.error(`Row ${i + 1}: Please select ${useBond ? 'exactly two' : 'a'} interface${useBond ? 's' : ''}.`);
          return;
        }

        // Ensure type is selected
        if (!row.type || (Array.isArray(row.type) && row.type.length === 0)) {
          message.error(`Row ${i + 1}: Please select a Type.`);
          return;
        }

        // In 'default' mode, skip validation for 'secondary' row
        const isSecondaryInDefault = configType === 'default' && row.type === 'secondary';
        if (!isSecondaryInDefault) {
          const requiredFields = ['ip', 'subnet', 'dns', 'gateway'];
          for (const field of requiredFields) {
            if (!row[field]) {
              message.error(`Row ${i + 1}: Please enter ${field.toUpperCase()}.`);
              return;
            }
          }
        }

        // Validate if any errors exist
        if (Object.keys(row.errors || {}).length > 0) {
          message.error(`Row ${i + 1} contains invalid entries. Please fix them.`);
          return;
        }
      }

      // 3. Validate Provider Network
      const providerValues = Providerform.getFieldsValue();
      const providerFields = ['cidr', 'gateway', 'startingIp', 'endingIp'];
      const providerTouched = providerFields.some((field) => !!providerValues[field]);
      if (providerTouched) {
        for (const field of providerFields) {
          if (!providerValues[field]) {
            message.error(`Provider Network: Please fill in the ${field} field.`);
            return;
          }
        }
      }

      // 4. Validate Tenant Network
      const tenantValues = Tenantform.getFieldsValue();
      const tenantFields = ['cidr', 'gateway', 'nameserver'];
      const tenantTouched = tenantFields.some((field) => !!tenantValues[field]);
      if (tenantTouched) {
        for (const field of tenantFields) {
          if (!tenantValues[field]) {
            message.error(`Tenant Network: Please fill in the ${field} field.`);
            return;
          }
        }
      }

      // ✅ All good
      message.success('All validations passed. Proceeding to submit...');
      // TODO: Add submit logic here
    } catch (error) {
      message.error('Please fix the errors in required fields.');
    }
  };

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

    if (!row.errors) row.errors = {};

    if (field === 'type' && configType === 'default') {
      row.type = value;

      const otherIndex = index === 0 ? 1 : 0;
      const otherRow = updatedData[otherIndex];

      if (value === 'primary') {
        otherRow.type = 'secondary';
      } else if (value === 'secondary') {
        otherRow.type = 'primary';
      }

      updatedData[otherIndex] = otherRow;
    } else {
      row[field] = value;

      // Validation for IP/DNS/Gateway
      if (['ip', 'dns', 'gateway'].includes(field)) {
        if (!ipRegex.test(value)) {
          row.errors[field] = 'Should be a valid address';
        } else {
          delete row.errors[field];
        }
      }

      // Validation for subnet
      if (field === 'subnet') {
        if (!subnetRegex.test(value)) {
          row.errors[field] = 'Invalid subnet format';
        } else {
          delete row.errors[field];
        }
      }

      if (field === 'interface') {
        // For bonding, limit to max 2 interfaces
        if (useBond && value.length > 2) {
          value = value.slice(0, 2);
        }

        row.interface = value;
      }
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
        <Tooltip placement='right' title="VLAN ID(1-4094)">
          <Input
            value={record.vlanId ?? ''}
            placeholder="Enter VLAN ID"
            onChange={(e) => {
              const value = e.target.value;
              // 1) Allow only digits
              if (!/^[0-9]*$/.test(value)) return;
              // 2) Allow max 4 digits
              if (value.length > 4) return;
              // 3) Allow only range 1–4094 when value is not empty
              if (value && (Number(value) < 1 || Number(value) > 4094)) return;
              // All checks passed ➔ call the handler
              handleCellChange(index, 'vlanId', value);
            }}
          />
        </Tooltip>
      ),
    };

    const mainColumns = [
      {
        title: 'Interfaces Required',
        dataIndex: 'interface',
        render: (_, record, index) => {
          // Collect all selected interfaces from other rows
          const selectedInterfaces = tableData
            .filter((_, i) => i !== index) // exclude current row
            .flatMap(row => {
              if (useBond && Array.isArray(row.interface)) return row.interface;
              if (!useBond && row.interface) return [row.interface];
              return [];
            });

          const allInterfaces = ['eth0', 'eth1', 'eth2', 'eth3']; // Add more if needed
          const currentSelection = useBond
            ? Array.isArray(record.interface) ? record.interface : []
            : record.interface ? [record.interface] : [];

          const availableInterfaces = allInterfaces.filter(
            (iface) => !selectedInterfaces.includes(iface) || currentSelection.includes(iface)
          );

          return (
            <Select
              mode={useBond ? 'multiple' : undefined}
              style={{ width: '100%' }}
              value={record.interface}
              allowClear
              placeholder={useBond ? 'Select interfaces' : 'Select interface'}
              onChange={(value) => {
                // Enforce max 2 if bond is enabled
                if (useBond && Array.isArray(value) && value.length > 2) {
                  value = value.slice(0, 2);
                }
                handleCellChange(index, 'interface', value);
              }}
              maxTagCount={2}
            >
              {availableInterfaces.map((iface) => (
                <Option key={iface} value={iface}>
                  {iface}
                </Option>
              ))}
            </Select>
          );
        },
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
                <Option value="Management">
                  <Tooltip placement="right" title="Mangement" >
                    Mgmt
                  </Tooltip>
                </Option>
                <Option value="VXLAN">
                  <Tooltip placement="right" title="VXLAN">
                    VXLAN
                  </Tooltip>
                </Option>
                <Option value="Storage">
                  <Tooltip placement="right" title="Storage">
                    Storage
                  </Tooltip>
                </Option>
                <Option value="External Traffic">
                  <Tooltip placement="right" title="External Traffic">
                    External Traffic
                  </Tooltip>
                </Option>
              </>
            ) : (
              <>
                <Option value="primary">
                  <Tooltip placement="right" title="Primary">
                    Primary
                  </Tooltip>
                </Option>
                <Option value="secondary">
                  <Tooltip placement="right" title="Secondary">
                    Secondary
                  </Tooltip>
                </Option>
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
              disabled={shouldDisableFields(record)}
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
              disabled={shouldDisableFields(record)}
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
              disabled={shouldDisableFields(record)}
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
              disabled={shouldDisableFields(record)}
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
      <Form form={vipform} layout="vertical">
        <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
          <Form.Item
            name="vip"
            label={
              <span>
                Enter VIP&nbsp;
                <Tooltip placement="right" title="Virtual IP Address" >
                  <InfoCircleOutlined style={{
                    color: "#1890ff", fontSize: "14px", height: "12px",
                    width: "12px"
                  }} />
                </Tooltip>
              </span>
            }
            rules={[
              { required: true, message: 'VIP is required' },
              {
                pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                message: 'Invalid VIP format (e.g. 192.168.1.0)',
              },
            ]}
          >
            <Input maxLength={18} placeholder="Enter VIP" style={{ width: 200 }} />
          </Form.Item>

          <Form.Item
            name="disk"
            label={
              <span>
                Select Disks&nbsp;
                <Tooltip placement="right" title="Ceph OSD" >
                  <InfoCircleOutlined style={{
                    color: "#1890ff", fontSize: "14px", height: "12px",
                    width: "12px"
                  }} />
                </Tooltip>
              </span>
            }
            rules={[
              { required: true, message: 'Disk is required' }
            ]}
          >
            <Select
              placeholder="Select Disk"
              style={{ width: 200 }}
              allowClear
              mode='multiple'
            >
              <Option>
                /dev/sda
              </Option>
            </Select>
          </Form.Item>
          {configType === 'segregated' && (
            <Form.Item
              name="defaultGateway"
              label={
                <span>
                  Enter Default Gateway&nbsp;
                  <Tooltip placement="right" title="Default Gateway">
                    <InfoCircleOutlined
                      style={{
                        color: "#1890ff",
                        fontSize: "14px",
                        height: "12px",
                        width: "12px"
                      }}
                    />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Gateway is required' },
                {
                  pattern: /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/,
                  message: 'Invalid IP format (e.g. 192.168.1.1)',
                },
              ]}
            >
              <Input maxLength={18} placeholder="Enter Gateway" style={{ width: 200 }} />
            </Form.Item>
          )}
        </div>
      </Form>
      <Divider />
      <div
        style={{
          display: "flex",
          alignItems: "center", // ✅ This ensures vertical alignment
          marginTop: "20px",
          marginBottom: "5px",
          gap: "7px"
        }}
      >
        <h4 style={{ userSelect: "none", margin: 0 }}>Provider Network</h4>
        <p style={{ margin: 0 }}>(optional)</p>
        <Tooltip placement="right" title="Provider Network" >
          <InfoCircleOutlined
            style={{
              color: "#1890ff",
              fontSize: "15.5px",
              height: "12px",
              width: "12px"
            }}
          />
        </Tooltip>
      </div>
      <Form form={Providerform} >
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
      <div
        style={{
          display: "flex",
          alignItems: "center", // ✅ This ensures vertical alignment
          marginTop: "20px",
          marginBottom: "8px",
          gap: "7px"
        }}
      >
        <h4 style={{ userSelect: "none", margin: 0 }}>Tenant Network</h4>
        <p style={{ margin: 0 }}>(optional)</p>
        <Tooltip placement="right" title="Tenant Network" >
          <InfoCircleOutlined
            style={{
              color: "#1890ff",
              fontSize: "15.5px",
              height: "12px",
              width: "12px"
            }}
          />
        </Tooltip>
      </div>
      <Form form={Tenantform} layout="vertical">
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
          <Button htmlType="button" danger onClick={() => {
            vipform.resetFields();
            Providerform.resetFields();
            Tenantform.resetFields();
            handleReset(); // resets the table
          }}>
            Reset Values
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Space>
      </Flex>
    </div >
  );
};

export default Deployment;
