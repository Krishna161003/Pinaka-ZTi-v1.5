import React, { useRef, useState, useEffect } from "react";
import {
  Divider,
  Table,
  Button,
  Breadcrumb,
  Input,
  Space,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { CloudOutlined, InfoCircleOutlined } from "@ant-design/icons";

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const ActivateKey = () => {
  const cloudName = getCloudNameFromMetadata();



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
          <Button type="primary">Check</Button>
        </Space>
      </div>

    </div>
  )
}

export default ActivateKey
