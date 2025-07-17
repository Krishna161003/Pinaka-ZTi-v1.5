import React, { useState } from "react";
import {
  Divider,
  Table,
  Button,
  Breadcrumb,
  Input,
  Space,
  Empty,
  Typography,
  Result,
  Spin,
} from "antd";
import {
  HomeOutlined,
  CloudOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Paragraph, Text } = Typography;

const getCloudNameFromMetadata = () => {
  const cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null;
};
const hostIP = window.location.hostname;
// const hostIP = "192.168.20.195"


const ActivateKey = ({ next, onValidationResult }) => {
  const cloudName = getCloudNameFromMetadata();
  const [licenseCode, setLicenseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // stores API response
  const [errorMsg, setErrorMsg] = useState(""); // stores error message

  const handleCheckLicense = async () => {
    if (!licenseCode) return;

    setLoading(true);
    setResult(null);
    setErrorMsg("");

    try {
      const response = await fetch(`https://${hostIP}:2020/decrypt-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encrypted_code: licenseCode }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        if (onValidationResult) onValidationResult("success");
      } else {
        setErrorMsg(data.message || "License validation failed.");
        if (onValidationResult) onValidationResult("failed");
      }
    } catch (err) {
      setErrorMsg("Network or server error.");
      if (onValidationResult) onValidationResult("failed");
    } finally {
      setLoading(false);
    }
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
          <Breadcrumb.Item>System Interface</Breadcrumb.Item>
          <Breadcrumb.Item>License Activation</Breadcrumb.Item>
        </Breadcrumb>
        <Button
          type="primary"
          style={{ width: 75 }}
          disabled={!(result && result.success)}
          onClick={next}
        >
          Next
        </Button>
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
            value={licenseCode}
            onChange={(e) => setLicenseCode(e.target.value)}
          />
          <Button type="primary" onClick={handleCheckLicense} loading={loading}>
            Check
          </Button>
        </Space>

        <label style={{ display: "block", fontWeight: 500, marginTop: "20px" }}>
          License Details:
        </label>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            minHeight: "80px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
            backgroundColor: "#fafafa",
            fontSize: "14px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin />
              <p style={{margin:"2px"}}>Validating...</p>
            </div>
          ) : result ? (
            <Result
              status="success"
              title="Success"
              subTitle={ `License Type: ${result.key_type} key | License Period: ${result.license_period} days | MAC: ${result.mac_address}`}
            />
          ) : errorMsg ? (
            <Result status="error" title="Failed" subTitle="">
              <div className="desc">
                <Paragraph>
                  <Text strong style={{ fontSize: 16 }}>
                    The content you submitted has the following error:
                  </Text>
                </Paragraph>
                <Paragraph>
                  <CloseCircleOutlined className="site-result-demo-error-icon" /> {errorMsg}
                </Paragraph>
              </div>
            </Result>
          ) : (
            <Empty description={<Typography.Text>No License Details</Typography.Text>} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivateKey;
