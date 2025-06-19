import React, { useRef, useState, useEffect } from "react";
import {
  Divider,
  Table,
  Button,
  Breadcrumb,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { CloudOutlined, InfoCircleOutlined } from "@ant-design/icons";


const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const DataTable = ({ onNodeSelect }) => {
  const cloudName = getCloudNameFromMetadata();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const hostIP = process.env.REACT_APP_HOST_IP;

  useEffect(() => {
    // scanNetwork();
  }, []);


  const columns = [
    {
      title: "Interface",
      dataIndex: "interface",
      key: "interface",
    },
    {
      title: "MAC Address",
      dataIndex: "mac",
      key: "mac",
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.23%" }}>
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>

      {/* Flex container to align Breadcrumb and Button in same row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          // alignItems: "center",
          // marginBottom: "16px",
        }}
      >
        <Breadcrumb>
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>Deployment Options</Breadcrumb.Item>
          <Breadcrumb.Item>Validation</Breadcrumb.Item>
          <Breadcrumb.Item>System Interfaces</Breadcrumb.Item>
        </Breadcrumb>

        <Button
          size="middle"
          style={{ width: "75px" }}
          type="primary"
          disabled={selectedNodes.length === 0}
        >
          Next
        </Button>
      </div>

      <Divider />
      <div style={{ display: "flex", gap: "40px", marginBottom: "16px", marginLeft: "3px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Number of Sockets:</span>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              padding: "4px 12px",
              minWidth: "40px",
              textAlign: "center",
              backgroundColor: "#fafafa",
            }}
          >
            {/* {numberOfSockets} */}2
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>License Required:</span>
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
              padding: "4px 12px",
              minWidth: "40px",
              textAlign: "center",
              backgroundColor: "#fafafa",
            }}
          >
            {/* {licensesRequired} */}2
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            size="middle"
            style={{ width: "95px" }}
            type="primary"
          >
            Copy Details
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={nodes}
        size="middle"
        rowKey="ip"
        pagination={{
          current: currentPage,
          pageSize: itemsPerPage,
          onChange: (page) => setCurrentPage(page),
        }}
        rowSelection={{
          type: "radio",
          onChange: (_, selectedNodes) => setSelectedNodes(selectedNodes),
          selectedRowKeys: selectedNodes.length ? [selectedNodes[0].ip] : [],
        }}
        loading={{
          spinning: isScanning,
          tip: "Scanning...",
        }}
      />
      <div style={{ marginTop: "16px" }}>
        <InfoCircleOutlined style={{ color: "#1890ff", fontSize: "15.5px", marginRight: "10px" }} />
        <span style={{ fontSize: "14px" }}>
          <strong>Note:</strong>
          <br />
          1. To obtain your license key, copy the details from the table above and email them to
          <a href="mailto:support@pinakastra.cloud"> support@pinakastra.cloud</a> or contact us at
          <a href="tel:+919008488882"> +91 90084 88882</a>.
          <br />
          (OR)
          <br />
          2. If you have already purchased the license and completed the payment and you have the payment ID,
          visit <a href="https://pinakastra.com/generate-key" target="_blank" rel="noopener noreferrer">
            https://pinakastra.com/generate-key
          </a>, fill in the required details, and generate your activation key.
        </span>
      </div>
    </div>
  );
};

export const Discovery = ({ onNodeSelect }) => {
  return <DataTable onNodeSelect={onNodeSelect} />;
};

export default Discovery;
