import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Form, Radio, Checkbox, Divider, Typography, Space, Tooltip, message, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { buildNetworkConfigPayload } from './networkapply.format';

const NetworkApply = () => {

const { Option } = Select;
const ipRegex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.|$)){4}$/;
const subnetRegex = /^(255|254|252|248|240|224|192|128|0+)\.((255|254|252|248|240|224|192|128|0+)\.){2}(255|254|252|248|240|224|192|128|0+)$/;

// Get the nodes from sessionStorage (as in Addnode.jsx)
function getLicenseNodes() {
  const saved = sessionStorage.getItem('cloud_licenseNodes');
  return saved ? JSON.parse(saved) : [];
}

const RESTART_DURATION = 3000; // ms
const BOOT_DURATION = 5000; // ms after restart
const RESTART_ENDTIME_KEY = 'cloud_networkApplyRestartEndTimes';
const BOOT_ENDTIME_KEY = 'cloud_networkApplyBootEndTimes';

  const [licenseNodes, setLicenseNodes] = useState(getLicenseNodes());
  
  // Dynamic per-node disks and interfaces
  const [nodeDisks, setNodeDisks] = useState({});
  const [nodeInterfaces, setNodeInterfaces] = useState({});

  // Fetch disks and interfaces for a node
  const fetchNodeData = async (ip) => {
    try {
      const [diskRes, ifaceRes] = await Promise.all([
        fetch(`https://${ip}:2020/get-disks`).then(r => r.json()),
        fetch(`https://${ip}:2020/get-interfaces`).then(r => r.json()),
      ]);
      setNodeDisks(prev => ({ ...prev, [ip]: diskRes.disks || [] }));
      setNodeInterfaces(prev => ({ ...prev, [ip]: (ifaceRes.interfaces || []).map(i => ({ iface: i.iface })) }));
    } catch (e) {
      message.error(`Failed to fetch data from node ${ip}`);
    }
  };

  // On mount, fetch for all nodes
  useEffect(() => {
    licenseNodes.forEach(node => {
      if (node.ip) fetchNodeData(node.ip);
    });
  }, [licenseNodes]);
  // Per-card loading and applied state, restore from sessionStorage if available
  const getInitialCardStatus = () => {
    const saved = sessionStorage.getItem('cloud_networkApplyCardStatus');
    if (saved) return JSON.parse(saved);
    return licenseNodes.map(() => ({ loading: false, applied: false }));
  };
  const [cardStatus, setCardStatus] = useState(getInitialCardStatus);
  // For loader recovery timers
  const timerRefs = React.useRef([]);
  // Restore forms from sessionStorage if available
  const getInitialForms = () => {
    const saved = sessionStorage.getItem('cloud_networkApplyForms');
    if (saved) return JSON.parse(saved);
    // Attach license details if available
    const licenseDetailsMap = (() => {
      const saved = sessionStorage.getItem('cloud_licenseActivationResults');
      if (!saved) return {};
      try {
        const arr = JSON.parse(saved);
        const map = {};
        for (const row of arr) {
          if (row.ip && row.details) map[row.ip] = row.details;
        }
        return map;
      } catch {
        return {};
      }
    })();
    return licenseNodes.map(node => ({
      ip: node.ip,
      configType: 'default',
      useBond: false,
      tableData: generateRows('default', false),
      defaultGateway: '',
      defaultGatewayError: '',
      licenseType: licenseDetailsMap[node.ip]?.type || '-',
      licensePeriod: licenseDetailsMap[node.ip]?.period || '-',
      licenseCode: licenseDetailsMap[node.ip]?.licenseCode || '-',
      selectedDisks: [],
      diskError: '',
      selectedRoles: [],
      roleError: '',
    }));
  };
  const [forms, setForms] = useState(getInitialForms);

  // If licenseNodes changes (e.g. after license activation), restore from sessionStorage if available, else reset
  useEffect(() => {
    const savedForms = sessionStorage.getItem('cloud_networkApplyForms');
    const savedStatus = sessionStorage.getItem('cloud_networkApplyCardStatus');
    if (savedForms && savedStatus) {
      setForms(JSON.parse(savedForms));
      setCardStatus(JSON.parse(savedStatus));
    } else {
      setForms(
        licenseNodes.map(node => ({
          ip: node.ip,
          configType: 'default',
          useBond: false,
          tableData: generateRows('default', false),
          defaultGateway: '',
          defaultGatewayError: '',
          selectedDisks: [],
          diskError: '',
          selectedRoles: [],
          roleError: '',
        }))
      );
      setCardStatus(licenseNodes.map(() => ({ loading: false, applied: false })));
    }
  }, [licenseNodes]);

  // Loader recovery: robustly clear stuck loaders and expired timers
  useEffect(() => {
    const restartEndTimesRaw = sessionStorage.getItem(RESTART_ENDTIME_KEY);
    const bootEndTimesRaw = sessionStorage.getItem(BOOT_ENDTIME_KEY);
    const restartEndTimes = restartEndTimesRaw ? JSON.parse(restartEndTimesRaw) : {};
    const bootEndTimes = bootEndTimesRaw ? JSON.parse(bootEndTimesRaw) : {};
    const now = Date.now();
    let changed = false;
    let newCardStatus = null;
    // For storing results
    let networkApplyResult = {};
    const resultRaw = sessionStorage.getItem('cloud_networkApplyResult');
    if (resultRaw) {
      try {
        networkApplyResult = JSON.parse(resultRaw);
      } catch (e) {
        networkApplyResult = {};
      }
    }
    cardStatus.forEach((status, idx) => {
      // Loader should only be up if bootEndTime exists and is in the future
      const bootTime = bootEndTimes[idx];
      if (status.loading) {
        if (!bootTime || isNaN(bootTime) || bootTime <= now) {
          // No boot time or boot time expired/corrupted: clear loader
          newCardStatus = (newCardStatus || [...cardStatus]);
          newCardStatus[idx] = { loading: false, applied: true };
          delete restartEndTimes[idx];
          delete bootEndTimes[idx];
          changed = true;
          // Store the form data for this node in sessionStorage under its IP
          const nodeIp = forms[idx]?.ip || `node${idx + 1}`;
          networkApplyResult[nodeIp] = {
            ...forms[idx],
            tableData: Array.isArray(forms[idx]?.tableData) ? forms[idx].tableData.map(row => ({ ...row, type: row.type })) : [],
          };
        } else {
          // Set a timer to clear loader at bootEndTime
          if (!timerRefs.current[idx]) {
            timerRefs.current[idx] = setTimeout(() => {
              setCardStatus(prev => prev.map((s, i) => i === idx ? { loading: false, applied: true } : s));
              // Remove from sessionStorage
              const storedR = sessionStorage.getItem(RESTART_ENDTIME_KEY);
              const objR = storedR ? JSON.parse(storedR) : {};
              const storedB = sessionStorage.getItem(BOOT_ENDTIME_KEY);
              const objB = storedB ? JSON.parse(storedB) : {};
              delete objR[idx];
              delete objB[idx];
              sessionStorage.setItem(RESTART_ENDTIME_KEY, JSON.stringify(objR));
              sessionStorage.setItem(BOOT_ENDTIME_KEY, JSON.stringify(objB));
              // Store the form data for this node in sessionStorage under its IP
              const nodeIp = forms[idx]?.ip || `node${idx + 1}`;
              let networkApplyResultInner = {};
              const resultRawInner = sessionStorage.getItem('cloud_networkApplyResult');
              if (resultRawInner) {
                try {
                  networkApplyResultInner = JSON.parse(resultRawInner);
                } catch (e) {
                  networkApplyResultInner = {};
                }
              }
              networkApplyResultInner[nodeIp] = {
                ...forms[idx],
                tableData: Array.isArray(forms[idx]?.tableData) ? forms[idx].tableData.map(row => ({ ...row, type: row.type })) : [],
              };
              sessionStorage.setItem('cloud_networkApplyResult', JSON.stringify(networkApplyResultInner));
            }, bootTime - now);
          }
        }
      } else {
        // If not loading, ensure timer is cleared
        if (timerRefs.current[idx]) {
          clearTimeout(timerRefs.current[idx]);
          timerRefs.current[idx] = null;
        }
        // If applied and not yet stored, store the result (for robustness)
        if (status.applied) {
          const nodeIp = forms[idx]?.ip || `node${idx + 1}`;
          if (!networkApplyResult[nodeIp]) {
            networkApplyResult[nodeIp] = {
              ...forms[idx],
              tableData: Array.isArray(forms[idx]?.tableData) ? forms[idx].tableData.map(row => ({ ...row, type: row.type })) : [],
            };
          }
        }
      }
    });
    if (changed && newCardStatus) {
      setCardStatus(newCardStatus);
      sessionStorage.setItem(RESTART_ENDTIME_KEY, JSON.stringify(restartEndTimes));
      sessionStorage.setItem(BOOT_ENDTIME_KEY, JSON.stringify(bootEndTimes));
    }
    // Also, on every render, clean up any timers for cards that are no longer loading
    cardStatus.forEach((status, idx) => {
      if (!status.loading && timerRefs.current[idx]) {
        clearTimeout(timerRefs.current[idx]);
        timerRefs.current[idx] = null;
      }
    });
    // Persist the result object
    sessionStorage.setItem('cloud_networkApplyResult', JSON.stringify(networkApplyResult));
  }, [cardStatus, forms]);

  // Persist forms and cardStatus to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('cloud_networkApplyForms', JSON.stringify(forms));
  }, [forms]);

  useEffect(() => {
    sessionStorage.setItem('cloud_networkApplyCardStatus', JSON.stringify(cardStatus));
  }, [cardStatus]);

  function handleDiskChange(idx, value) {
    setForms(prev => prev.map((f, i) => i === idx ? { ...f, selectedDisks: value, diskError: '' } : f));
  }
  function handleRoleChange(idx, value) {
    setForms(prev => prev.map((f, i) => i === idx ? { ...f, selectedRoles: value, roleError: '' } : f));
  }

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
  // Reset handler for a specific node
  const handleReset = (idx) => {
    setForms(prev => prev.map((f, i) => i === idx ? {
      ...f,
      configType: 'default',
      useBond: false,
      tableData: generateRows('default', false),
      defaultGateway: '',
      defaultGatewayError: '',
    } : f));
  };

  const handleCellChange = (nodeIdx, rowIdx, field, value) => {
    setForms(prev => prev.map((f, i) => {
      if (i !== nodeIdx) return f;
      const updated = [...f.tableData];
      const row = { ...updated[rowIdx] };
      if (!row.errors) row.errors = {};

      if (field === 'type' && f.configType === 'default') {
        row.type = value;
        // Enforce primary/secondary mutual exclusivity
        const otherIndex = rowIdx === 0 ? 1 : 0;
        const otherRow = updated[otherIndex];
        if (value === 'primary') {
          otherRow.type = 'secondary';
        } else if (value === 'secondary') {
          otherRow.type = 'primary';
        }
        updated[otherIndex] = otherRow;
      } else if (field === 'defaultGateway') {
        // Handle default gateway separately
        const newForm = { ...f, defaultGateway: value };
        if (!ipRegex.test(value)) {
          newForm.defaultGatewayError = 'Should be a valid address';
        } else {
          newForm.defaultGatewayError = '';
        }
        return newForm;
      } else {
        row[field] = value;
        // Validation for IP/DNS/Gateway
        if (["ip", "dns", "gateway"].includes(field)) {
          if (!ipRegex.test(value)) {
            row.errors[field] = 'Should be a valid address';
          } else {
            // Duplicate IP check for segregated mode
            if (field === "ip" && f.configType === "segregated") {
              const isDuplicate = updated.some((r, i) => i !== rowIdx && r.ip === value && value);
              if (isDuplicate) {
                row.errors.ip = 'Duplicate IP address in another row';
              } else {
                delete row.errors.ip;
              }
            } else {
              delete row.errors[field];
            }
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
        // Validation for interface (bonding: max 2)
        if (field === 'interface') {
          if (f.useBond && value.length > 2) {
            value = value.slice(0, 2);
          }
          row.interface = value;
        }
        // Validation for bondName uniqueness
        if (field === 'bondName') {
          const isDuplicate = updated.some((r, i) => i !== rowIdx && r.bondName === value);
          if (isDuplicate) {
            row.errors[field] = 'Bond name must be unique';
          } else {
            delete row.errors[field];
          }
        }
        // Validation for VLAN ID
        if (field === 'vlanId') {
          if (value && (!/^[0-9]*$/.test(value) || value.length > 4 || Number(value) < 1 || Number(value) > 4094)) {
            row.errors[field] = 'VLAN ID must be 1-4094';
          } else {
            delete row.errors[field];
          }
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
        <Form.Item
          validateStatus={record.errors?.bondName ? 'error' : ''}
          help={record.errors?.bondName}
          style={{ marginBottom: 0 }}
        >
          <Input
            value={record.bondName ?? ''}
            placeholder="Enter Bond Name"
            onChange={e => handleCellChange(nodeIdx, rowIdx, 'bondName', e.target.value)}
          />
        </Form.Item>
      ),
    };

    const vlanColumn = {
      title: 'VLAN ID',
      dataIndex: 'vlanId',
      render: (_, record, rowIdx) => (
        <Tooltip placement='right' title="VLAN ID (1-4094, optional)">
          <Form.Item
            validateStatus={record.errors?.vlanId ? 'error' : ''}
            help={record.errors?.vlanId}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.vlanId ?? ''}
              placeholder="Enter VLAN ID (optional)"
              onChange={e => handleCellChange(nodeIdx, rowIdx, 'vlanId', e.target.value)}
            />
          </Form.Item>
        </Tooltip>
      ),
    };

    const mainColumns = [
      {
        title: 'Interfaces Required',
        dataIndex: 'interface',
        render: (_, record, rowIdx) => {
          const selectedInterfaces = form.tableData
            .filter((_, i) => i !== rowIdx)
            .flatMap(row => {
              if (form.useBond && Array.isArray(row.interface)) return row.interface;
              if (!form.useBond && row.interface) return [row.interface];
              return [];
            });
          const currentSelection = form.useBond
            ? Array.isArray(record.interface) ? record.interface : []
            : record.interface ? [record.interface] : [];
          const availableInterfaces = (nodeInterfaces[form.ip] || []).filter(
            (iface) =>
              !selectedInterfaces.includes(iface.iface) || currentSelection.includes(iface.iface)
          ) || [];
          return (
            <Select
              mode={form.useBond ? 'multiple' : undefined}
              style={{ width: '100%' }}
              value={record.interface}
              allowClear
              placeholder="Select interface"
              // placeholder={form.useBond ? 'Select interfaces' : 'Select interface'}
              onChange={(value) => {
                if (form.useBond && Array.isArray(value) && value.length > 2) {
                  value = value.slice(0, 2);
                }
                handleCellChange(nodeIdx, rowIdx, 'interface', value);
              }}
              maxTagCount={2}
            >
              {availableInterfaces.map((ifaceObj) => (
                <Option key={ifaceObj.iface} value={ifaceObj.iface}>
                  {ifaceObj.iface}
                </Option>
              ))}
            </Select>
          );
        },
      },
      {
        title: 'Type',
        dataIndex: 'type',
        render: (_, record, rowIdx) => {
          let managementTaken = false;
          if (form.configType === 'segregated') {
            managementTaken = form.tableData.some((row, i) => i !== rowIdx && Array.isArray(row.type) && row.type.includes('Management'));
          }
          return (
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
                  {!managementTaken || (Array.isArray(record.type) && record.type.includes('Management')) ? (
                    <Option value="Management">
                      <Tooltip placement="right" title="Management" >
                        Mgmt
                      </Tooltip>
                    </Option>
                  ) : null}
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
          );
        },
      },
      {
        title: 'IP ADDRESS',
        dataIndex: 'ip',
        render: (_, record, rowIdx) => (
          <Form.Item
            validateStatus={record.errors?.ip ? 'error' : ''}
            help={record.errors?.ip}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.ip}
              placeholder="Enter IP Address"
              onChange={e => handleCellChange(nodeIdx, rowIdx, 'ip', e.target.value)}
              disabled={form.configType === 'default' && record.type === 'secondary'}
            />
          </Form.Item>
        ),
      },
      {
        title: 'SUBNET MASK',
        dataIndex: 'subnet',
        render: (_, record, rowIdx) => (
          <Form.Item
            validateStatus={record.errors?.subnet ? 'error' : ''}
            help={record.errors?.subnet}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.subnet}
              placeholder="Enter Subnet"
              onChange={e => handleCellChange(nodeIdx, rowIdx, 'subnet', e.target.value)}
              disabled={form.configType === 'default' && record.type === 'secondary'}
            />
          </Form.Item>
        ),
      },
      {
        title: 'DNS Servers',
        dataIndex: 'dns',
        render: (_, record, rowIdx) => (
          <Form.Item
            validateStatus={record.errors?.dns ? 'error' : ''}
            help={record.errors?.dns}
            style={{ marginBottom: 0 }}
          >
            <Input
              value={record.dns}
              placeholder="Enter Nameserver"
              onChange={e => handleCellChange(nodeIdx, rowIdx, 'dns', e.target.value)}
              disabled={form.configType === 'default' && record.type === 'secondary'}
            />
          </Form.Item>
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
    if (cardStatus[nodeIdx].loading || cardStatus[nodeIdx].applied) return;
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
      // Validate required fields (skip for secondary in default mode)
      if (!(form.configType === 'default' && row.type === 'secondary')) {
        for (const field of ['ip', 'subnet', 'dns']) {
          if (!row[field]) {
            message.error(`Row ${i + 1}: Please enter ${field.toUpperCase()}.`);
            return;
          }
        }
      }
      if (Object.keys(row.errors || {}).length > 0) {
        message.error(`Row ${i + 1} contains invalid entries. Please fix them.`);
        return;
      }
    }
    // Validate default gateway
    if (!form.defaultGateway) {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, defaultGatewayError: 'Required' } : f));
      message.error('Please enter Default Gateway.');
      return;
    }
    if (!ipRegex.test(form.defaultGateway)) {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, defaultGatewayError: 'Invalid IP' } : f));
      message.error('Default Gateway must be a valid IP address.');
      return;
    }
    // Validate disks
    if (!form.selectedDisks || form.selectedDisks.length === 0) {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, diskError: 'At least one disk required' } : f));
      message.error('Please select at least one disk.');
      return;
    } else {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, diskError: '' } : f));
    }
    // Validate roles
    if (!form.selectedRoles || form.selectedRoles.length === 0) {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, roleError: 'At least one role required' } : f));
      message.error('Please select at least one role.');
      return;
    } else {
      setForms(prev => prev.map((f, i) => i === nodeIdx ? { ...f, roleError: '' } : f));
    }
    // Submit logic here (API call or sessionStorage)
    const payload = buildNetworkConfigPayload(form);
    fetch(`https://${form.ip}:2020/submit-network-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setCardStatus(prev => prev.map((s, i) => i === nodeIdx ? { ...s, loading: true } : s));
          // Store restartEndTime and bootEndTime in sessionStorage
          const restartEndTimesRaw = sessionStorage.getItem(RESTART_ENDTIME_KEY);
          const bootEndTimesRaw = sessionStorage.getItem(BOOT_ENDTIME_KEY);
          const restartEndTimes = restartEndTimesRaw ? JSON.parse(restartEndTimesRaw) : {};
          const bootEndTimes = bootEndTimesRaw ? JSON.parse(bootEndTimesRaw) : {};
          const now = Date.now();
          const restartEnd = now + RESTART_DURATION;
          const bootEnd = restartEnd + BOOT_DURATION;
          restartEndTimes[nodeIdx] = restartEnd;
          bootEndTimes[nodeIdx] = bootEnd;
          sessionStorage.setItem(RESTART_ENDTIME_KEY, JSON.stringify(restartEndTimes));
          sessionStorage.setItem(BOOT_ENDTIME_KEY, JSON.stringify(bootEndTimes));
          timerRefs.current[nodeIdx] = setTimeout(() => {
            message.success(`Network config for node ${form.ip} applied! Node restarting...`);
          }, RESTART_DURATION);
        } else {
          message.error(result.message || 'Failed to apply network configuration.');
        }
      })
      .catch(err => {
        message.error('Network error: ' + err.message);
      });
    return;

  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(t => t && clearTimeout(t));
    };
  }, []);

  // Check if all cards are applied
  const allApplied = cardStatus.length > 0 && cardStatus.every(s => s.applied);

  const handleNext = () => {
    // TODO: Implement next step (e.g., go to next tab or section)
    message.info('Proceeding to the next step...');
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Network Apply</Typography.Title>
        <Button
          type="primary"
          onClick={handleNext}
          style={{ width: 120, visibility: 'visible' }}
          disabled={!allApplied}
        >
          Deploy
        </Button>
      </div>
      <Divider />
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {forms.map((form, idx) => (
          <Spin spinning={cardStatus[idx]?.loading} tip="Applying network changes & restarting node...">
            <Card key={form.ip} title={`Node: ${form.ip}`} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <Radio.Group
                    value={form.configType}
                    onChange={e => handleConfigTypeChange(idx, e.target.value)}
                    disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}
                  >
                    <Radio value="default">Default</Radio>
                    <Radio value="segregated">Segregated</Radio>
                  </Radio.Group>
                  <Checkbox
                    checked={form.useBond}
                    onChange={e => handleUseBondChange(idx, e.target.checked)}
                    disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}
                  >
                    Bond
                  </Checkbox>
                </div>
                <Button
                  onClick={() => fetchNodeData(form.ip)}
                  size="small"
                  type="default"
                  style={{ width: 120 }}
                >
                  Refetch Data
                </Button>
              </div>
              <Table
                columns={getColumns(form, idx)}
                dataSource={form.tableData}
                pagination={false}
                bordered
                size="small"
                scroll={{ x: true }}
                rowClassName={() => (cardStatus[idx]?.loading || cardStatus[idx]?.applied ? 'ant-table-disabled' : '')}
              />

              {/* Default Gateway Field */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 24, margin: '16px 0 0 0' }}>
                <Form.Item
                  label="Default Gateway"
                  validateStatus={form.defaultGatewayError ? 'error' : ''}
                  help={form.defaultGatewayError}
                  required
                  style={{ minWidth: 220 }}
                >
                  <Input
                    value={form.defaultGateway}
                    placeholder="Enter Default Gateway"
                    onChange={e => handleCellChange(idx, 0, 'defaultGateway', e.target.value)}
                    style={{ width: 200 }}
                    disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}
                  />
                </Form.Item>
                <Form.Item
                  label="Select Disk"
                  required
                  validateStatus={form.diskError ? 'error' : ''}
                  help={form.diskError}
                  style={{ minWidth: 220 }}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select disk(s)"
                    value={form.selectedDisks || []}
                    style={{ width: 200 }}
                    disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}
                    onChange={value => handleDiskChange(idx, value)}
                  >
                    {(nodeDisks[form.ip] || []).map(disk => {
                      const diskValue = typeof disk === 'object' ? disk.value : disk;
                      const diskLabel = typeof disk === 'object' ? disk.value : disk;
                      return (
                        <Option key={diskValue} value={diskValue}>
                          {diskLabel}
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Select Role"
                  required
                  validateStatus={form.roleError ? 'error' : ''}
                  help={form.roleError}
                  style={{ minWidth: 220 }}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="Select role(s)"
                    value={form.selectedRoles || []}
                    style={{ width: 200 }}
                    disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}
                    onChange={value => handleRoleChange(idx, value)}
                  >
                    <Option value="Control">Control</Option>
                    <Option value="Compute">Compute</Option>
                    <Option value="Storage">Storage</Option>
                  </Select>
                </Form.Item>
              </div>
              {/* License Details Display - all in one line */}
              <div style={{ margin: '16px 0 0 0', padding: '8px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, marginRight: 16 }}>License Type:</span>
                <span>{form.licenseType || '-'}</span>
                <span style={{ fontWeight: 500, margin: '0 0 0 32px' }}>License Period:</span>
                <span>{form.licensePeriod || '-'}</span>
                <span style={{ fontWeight: 500, margin: '0 0 0 32px' }}>License Code:</span>
                <span>{form.licenseCode || '-'}</span>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginRight: '5%' }}>
                <Button danger onClick={() => handleReset(idx)} style={{ width: '110px', display: 'flex' }} disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}>
                  Reset Value
                </Button>
                <Button type="primary" onClick={() => handleSubmit(idx)} style={{ width: '110px', display: 'flex' }} disabled={cardStatus[idx]?.loading || cardStatus[idx]?.applied}>
                  Apply Change
                </Button>
              </div>
            </Card>
          </Spin>
        ))}
      </Space>
    </div>
  );
};

export default NetworkApply;