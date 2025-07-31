import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Tag, message, Empty } from 'antd';
import axios from 'axios';

const hostIP = window.location.hostname;

const ValidateTable = ({ nodes = [], onNext, results, setResults }) => {
    const [data, setData] = useState(results || []);
    const [infoModal, setInfoModal] = useState({ visible: false, details: '' });

    // Sync data with results or nodes
    useEffect(() => {
        if (results) setData(results);
        else setData(
            (nodes || []).map(node => ({
                ...node,
                key: node.ip,
                result: null,
                details: '',
                validating: false,
            }))
        );
    }, [results, nodes]);

    // Call backend validation API
    const handleValidate = async (ip) => {
        setData(prev => prev.map(row =>
            row.ip === ip ? { ...row, validating: true } : row
        ));

        try {
            const response = await axios.post(`https://${hostIP}:2020/validate`, {
                environment: 'production', // You might want to make this configurable
                mode: 'remote',
                host: ip
            });

            const { data: result } = response;
            
            if (result.error) {
                throw new Error(result.error);
            }

            const isPass = result.validation_result === 'passed';
            const details = [
                `CPU Cores: ${result.cpu_cores} (${result.validation.cpu ? '✓' : '✗'})`,
                `Memory: ${result.memory_gb}GB (${result.validation.memory ? '✓' : '✗'})`,
                `Disks: ${result.data_disks} (${result.validation.disks ? '✓' : '✗'})`,
                `Network Interfaces: ${result.network_interfaces} (${result.validation.network ? '✓' : '✗'})`
            ].join('\n');

            setData(prev => {
                const newData = prev.map(row =>
                    row.ip === ip
                        ? {
                            ...row,
                            result: isPass ? 'Pass' : 'Fail',
                            details: details,
                            validating: false,
                            validationData: result // Store full validation data
                        }
                        : row
                );
                setResults && setResults(newData);
                return newData;
            });
            
            message.success(`Validation for ${ip}: ${isPass ? 'Pass' : 'Fail'}`);
        } catch (error) {
            console.error('Validation error:', error);
            setData(prev => prev.map(row =>
                row.ip === ip 
                    ? { 
                        ...row, 
                        result: 'Fail', 
                        details: `Validation failed: ${error.message || 'Unknown error'}`,
                        validating: false 
                    } 
                    : row
            ));
            message.error(`Validation failed for ${ip}: ${error.message || 'Unknown error'}`);
        }
    };

    const columns = [
        {
            title: 'IP Address',
            dataIndex: 'ip',
            key: 'ip',
        },
        {
            title: 'Validate',
            key: 'validate',
            render: (_, record) => (
                <Button
                    type="primary"
                    loading={record.validating}
                    onClick={() => handleValidate(record.ip)}
                    disabled={record.validating}
                    style={{ width: "95px" }}
                >
                    Validate
                </Button>
            ),
        },
        {
            title: 'Result',
            dataIndex: 'result',
            key: 'result',
            render: (result) =>
                result === 'Pass' ? <Tag color="green">Pass</Tag> :
                    result === 'Fail' ? <Tag color="red">Fail</Tag> : <Tag>Pending</Tag>
        },
        {
            title: 'Info',
            key: 'info',
            render: (_, record) => (
                <Button
                    onClick={() => setInfoModal({ visible: true, details: record.details || 'No details yet.' })}
                    disabled={!record.result}
                    style={{ width: "95px" }}
                >
                    Info
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
                <Button
                    size="middle"
                    style={{ width: "75px" }}
                    type="primary"
                    onClick={() => {
                        const anyValidated = data.some(row => row.result !== null);
                        if (!anyValidated) {
                            message.warning("Please validate at least one node before proceeding.");
                            return;
                        }
                        const passed = data.filter(row => row.result === "Pass");
                        if (passed.length === 0) {
                            message.error("All nodes failed validation. Please ensure at least one node passes before proceeding.");
                            return;
                        }
                        onNext && onNext(passed, data);
                    }}
                >
                    Next
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="ip"
                pagination={false}
            />
            <Modal
                title="Validation Details"
                open={infoModal.visible}
                onCancel={() => setInfoModal({ visible: false, details: '' })}
                footer={null}
            >
                <div style={{ whiteSpace: 'pre-line' }}>{infoModal.details}</div>
            </Modal>
        </div>
    );
};

export default ValidateTable;
