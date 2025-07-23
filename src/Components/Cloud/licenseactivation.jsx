import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, message } from 'antd';

const LicenseActivationTable = ({ nodes = [] }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        setData(
            (nodes || []).map(node => ({
                ...node,
                key: node.ip,
                license: '',
                result: null,
                details: null,
                checking: false,
            }))
        );
    }, [nodes]);

    const handleLicenseChange = (ip, value) => {
        setData(prev => prev.map(row =>
            row.ip === ip ? { ...row, license: value } : row
        ));
    };

    // Simulate license check
    const handleCheck = (ip) => {
        setData(prev => prev.map(row =>
            row.ip === ip ? { ...row, checking: true } : row
        ));
        setTimeout(() => {
            const isSuccess = Math.random() > 0.3;
            setData(prev => prev.map(row =>
                row.ip === ip
                    ? {
                        ...row,
                        result: isSuccess ? 'Success' : 'Failed',
                        details: isSuccess
                            ? { type: 'Enterprise', period: '1 Year' }
                            : { type: 'N/A', period: 'N/A' },
                        checking: false,
                    }
                    : row
            ));
            message.success(`License check for ${ip}: ${isSuccess ? 'Success' : 'Failed'}`);
        }, 1200);
    };

    const columns = [
        {
            title: 'IP Address',
            dataIndex: 'ip',
            key: 'ip',
        },
        {
            title: 'License',
            key: 'license',
            render: (_, record) => (
                <span style={{ display: 'flex', gap: 8 }}>
                    <Input
                        value={record.license}
                        onChange={e => handleLicenseChange(record.ip, e.target.value)}
                        placeholder="Enter license key"
                        style={{ width: 150 }}
                        maxLength={12}
                        disabled={record.checking}
                    />
                    <Button
                        type="primary"
                        loading={record.checking}
                        onClick={() => handleCheck(record.ip)}
                        disabled={!record.license || record.checking}
                        style={{ width: 70 }}
                    >
                        Check
                    </Button>
                </span>
            ),
        },
        {
            title: 'Result',
            dataIndex: 'result',
            key: 'result',
            render: (result) =>
                result === 'Success' ? <Tag color="green">Success</Tag> :
                result === 'Failed' ? <Tag color="red">Failed</Tag> : <Tag>Pending</Tag>
        },
        {
            title: 'Details',
            key: 'details',
            render: (_, record) => (
                <div>
                    <div>Type: <b>{record.details?.type || '-'}</b></div>
                    <div>Period: <b>{record.details?.period || '-'}</b></div>
                </div>
            ),
        },
    ];

    return (
        <div>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="ip"
                pagination={false}
            />
        </div>
    );
};

export default LicenseActivationTable;
