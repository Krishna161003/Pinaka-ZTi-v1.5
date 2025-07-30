import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Tag, message, Empty } from 'antd';

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

    // Simulate validation API call
    const handleValidate = (ip) => {
        setData(prev => prev.map(row =>
            row.ip === ip ? { ...row, validating: true } : row
        ));
        setTimeout(() => {
            // Random pass/fail for demo
            const isPass = Math.random() > 0.3;
            setData(prev => {
                const newData = prev.map(row =>
                    row.ip === ip
                        ? {
                            ...row,
                            result: isPass ? 'Pass' : 'Fail',
                            details: isPass ? 'All checks passed.' : 'Validation failed: Example error.',
                            validating: false
                        }
                        : row
                );
                setResults && setResults(newData);
                return newData;
            });
            message.success(`Validation for ${ip}: ${isPass ? 'Pass' : 'Fail'}`);
        }, 1200);
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
