import React, { useState, useEffect, useRef } from "react";
import { Divider, Table, Breadcrumb, Button, Popover, Input, Form, Modal, Select, Spin, notification, message } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import axios from "axios";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { CloudOutlined } from "@ant-design/icons";
import { Row, Col } from 'antd';
import ProgressModal from './ProgressModal';
import DeploymentProgressBar from './DeploymentProgressBar'
import { useLocation, useNavigate } from "react-router-dom";
import requirementData from "../../Comparison/min_requirements.json";
import dayjs from 'dayjs';

// import Report from './Report';

const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const Validation = ({ nodes, onIbnUpdate, next }) => {
  const cloudName = getCloudNameFromMetadata();
  // const hostIP = process.env.REACT_APP_HOST_IP || "localhost";  //retrive host ip

  return (
    <div style={{ padding: "20px" }}>
      <h5 style={{ display: "flex", flex: "1", marginLeft: "-2%", marginBottom: "1.29%" }}>
        <CloudOutlined />
        &nbsp;&nbsp;{cloudName} Cloud
      </h5>
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Deployment Options</Breadcrumb.Item>
        <Breadcrumb.Item>Server Validation</Breadcrumb.Item>
      </Breadcrumb>

      <Divider />
      {/* <h4 style={{ userSelect: "none" }}>Server Validation</h4> */}

      <div style={{ display: "flex", flex: "1", gap: "30px", padding: "20px" }}>
        {/* Button Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h5>Validation for development environment:</h5>
              <Button type="primary" size="large" style={{ width: "120px", height: "35px" }}>
                Validate
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h5>Validation for production <br /> environment:</h5>
              <Button type="primary" size="large" style={{ width: "120px", height: "35px" }}>
                Validate
              </Button>
            </div>
          </div>
        </div>

        {/* Image, Line, and Result Box Wrapper */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, gap: "20px" }}>
          {/* Image */}
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACnElEQVR4nO1azWoUQRBuMIgeNGaz3V4igj8IvoBexKfYY6JvIIJTteBhbm68iw8RFm8q6EVZfYcknjYkgkpAk4u3T2rsLKuuYWa2ZzM9Wx/UpZfurqqvf+arXmMUCoVCocgNR7htCW8d4dAxUAsjHFrGm4td3DJVop3grmX8PPGA/2PiWzvBnWqi7+CUI2z5jD9bfIALpiYQXxzjufdtS3wNPollrI0mSLFg6oYUC46x7VfCWnj22Q+eYFWaHOPjDPf4hyNXJs7rfx+RxNgOugrsOPt+YJl0hvt7MErA5HkH1a2CTsb+5jj7dYYl3PNkfQqyVW3oAavGOGFTr4JOXOwHJ83Gxn7QVdCJk/1g5NkEq5VcKbPChKu7EBzhvV9C902kEN89ie8Kd3aMA+m8xFg0kUJ89wk4KNzZ1UDchDRNQFG4spmrGaZeASZyNDYBN1OcdoynjvDZMfYcYV3aKk+AEzk6Jk+raMvlH2HdX9NfxLy/vbxxTJMA/N0esu3YOsOfdYE9CXw5wTkxS/gqbfEngI6tMwwmJaCV4nyWAMJu9QmgzMFBlW05/euNtsBv9sXfJ3njaMoh2PMH4K4EH/YQJPyQji3CiokUS49xySfge+HOjtD3nV/JQCbG4Amv/eG5UXgA28U1y/h20t/w01oWQxdXCiegneB6UxJgH+Fq+S1AeBnjOSA+y/YtvQXc3B+CHMU1qFrAqhaAaoGWagGoFnCqBf6FagFSLQDVAqxaAKoFuExBhFULIJJ3gaHYvL4LDC+nOCNmCTvz+C4wlOBXHuJsloC5fBcg7Hj2xV99FzA5icz9F5lWhPXAIFrAEl406F2gX3iA5QQ3LGO/AWXxfSnxly8tEzaOKsRRmfhM6JcOXqFQKBSm+fgF8tw4l4opeaIAAAAASUVORK5CYII="
            alt="server"
            style={{ width: "200px", height: "220px", userSelect: "none", justifyItems: "center", marginLeft: "13%" }}
          />

          {/* Line with arrow */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flex: 1,
              height: "4px", // Slightly increased for consistency
              backgroundColor: "#000000",
              alignItems: "center",
            }}
          >
            {/* Arrowhead at the end of the line */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%) translateX(100%)",
                width: 0,
                height: 0,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: "8px solid #000000",
              }}
            ></div>
          </div>

          {/* Result Box */}
          <div
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              width: "260px",
              height: "220px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
            }}
          >
            <h4 style={{ marginBottom: "12px" }}>Validation Result</h4>
            <p style={{ color: "#555" }}>
              Please run a validation to see results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Validation;

