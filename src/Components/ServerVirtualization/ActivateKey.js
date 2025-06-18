import React, { useRef, useState, useEffect } from "react";
import {
  Divider,
  Table,
  Button,
  Breadcrumb,
  Input,
  Space,
  Empty,
  Typography,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { CloudOutlined, InfoCircleOutlined } from "@ant-design/icons";

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const ActivateKey = () => {
  const cloudName = getCloudNameFromMetadata();
  const [licenseCode, setLicenseCode] = useState("");


  return (
    <div style={{ padding: "20px" }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.25%" }}>
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>

      {/* Flex container to align Breadcrumb and Button in same row */}
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
          <Breadcrumb.Item>Deployment</Breadcrumb.Item>
          <Breadcrumb.Item>Validation</Breadcrumb.Item>
          <Breadcrumb.Item>System Interfaces</Breadcrumb.Item>
          <Breadcrumb.Item>License Activation</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Divider />
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
          Enter your license code
        </label>
        <Space>
          <Input
            maxLength={12}
            placeholder="Enter code"
            style={{ width: 200 }}
          />
          <Button type="primary" >Check</Button>
        </Space>
        {/* License details box */}
        <label style={{ display: "block", fontWeight: 500, marginTop: "20px" }}>
          License Deatils:
        </label>
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            minHeight: "60px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "#fafafa",
            fontSize: "14px",
          }}
        >
          {/* Replace this with actual license details dynamically */}
          <Empty description={
            <Typography.Text>
              No License Details
            </Typography.Text>
          } />
        </div>
      </div>

    </div>
  )
}

export default ActivateKey
