import React, { useRef, useState, useEffect } from "react";
import {
  message,
  Divider,
  Table,
  Button,
  Breadcrumb,
  Input,
  Space,
  Alert,
  Spin
} from "antd";
import { HomeOutlined, SearchOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CloudOutlined } from "@ant-design/icons";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import Highlighter from "react-highlight-words";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const getCloudNameFromMetadata = () => {
  let cloudNameMeta = document.querySelector('meta[name="cloud-name"]');
  return cloudNameMeta ? cloudNameMeta.content : null; // Return the content of the meta tag
};

const DataTable = ({ onNodeSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false); // To track if the configuration is being updated
  const cloudName = getCloudNameFromMetadata();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [subnet, setSubnet] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [warningMessage, setWarningMessage] = useState(null);
  const hostIP = process.env.REACT_APP_HOST_IP;
  const errorMessage = "Please enter a subnet to scan";

  useEffect(() => {
    scanNetwork();
  }, []);

  const handleNextClick = () => {
    onNodeSelect(selectedNodes);

  };

  const handleDefaultSubnetScan = async () => {
    setIsScanning(true); // Start loading
    try {
      // Fetch the active nodes from the backend
      const response = await axios.get(`https://${hostIP}:8000/scan`);

      if (response.data && Array.isArray(response.data)) {
        setSubnet("");
        setNodes(response.data); // Directly update nodes with the fetched data
      } else {
        messageApi.error("No active nodes found in the local network.");
      }
    } catch (error) {
      console.error("Error getting active nodes:", error);
      messageApi.error("Failed to detect the local network. Please try again.");
    } finally {
      setIsScanning(false); // End loading
    }
  };

  useEffect(() => {
    // Load subnet from sessionStorage if available
    const savedSubnet = sessionStorage.getItem("subnet");
    if (savedSubnet) {
      setSubnet(savedSubnet);
      scanNetwork(savedSubnet);
    }
  
    // Load selected nodes from sessionStorage if available
    const savedSelectedNodes = sessionStorage.getItem("selectedNodes");
    if (savedSelectedNodes) {
      setSelectedNodes(JSON.parse(savedSelectedNodes));
    }
  
    // Load nodes from sessionStorage if available
    const savedNodes = sessionStorage.getItem("nodes");
    if (savedNodes) {
      setNodes(JSON.parse(savedNodes));
    }
  }, []);
  
  useEffect(() => {
    // Store subnet in sessionStorage
    if (subnet) {
      sessionStorage.setItem("subnet", subnet);
    }
  }, [subnet]);
  
  useEffect(() => {
    // Store selected nodes in sessionStorage
    if (selectedNodes.length > 0) {
      sessionStorage.setItem("selectedNodes", JSON.stringify(selectedNodes));
    }
  }, [selectedNodes]);
  
  useEffect(() => {
    // Store nodes in sessionStorage
    if (nodes.length > 0) {
      sessionStorage.setItem("nodes", JSON.stringify(nodes));
    }
  }, [nodes]);
  

  const scanNetwork = async (subnet = "") => {
    setIsScanning(true); // Start loading
    try {
      if (!subnet) {
        setWarningMessage(
          <div
            style={{
              color: "red",
              fontSize: "12px",
              whiteSpace: "nowrap", // Prevent wrapping of the text
              overflow: "hidden", // Hide any overflowing text if it exceeds container width
              textOverflow: "ellipsis", // Add ellipsis for overflow text
            }}
          >
            {errorMessage}
          </div>
        );
        return;
      }

      const response = await axios.get(`https://${hostIP}:8000/scan`, {
        params: { subnet },
      });

      if (response.data && Array.isArray(response.data)) {
        setNodes(response.data); // Update nodes with the active nodes found in the scan
        if (response.data.length === 0) {
          messageApi.info("No active nodes found in the specified network.");
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        messageApi.error("Invalid subnet format. Please enter a valid CIDR subnet.");
      } else {
        messageApi.error("An unexpected error occurred while scanning the network.");
      }
    } finally {
      setIsScanning(false); // End loading
    }
  };

  const handleSubnetChange = (e) => {
    const value = e.target.value;
    setSubnet(value);

    if (value) {
      setWarningMessage(null);
    } else {
      setWarningMessage(
        <div
          style={{
            color: "red",
            fontSize: "12px",
            whiteSpace: "nowrap", // Prevent wrapping of the text
            overflow: "hidden", // Hide any overflowing text if it exceeds container width
            textOverflow: "ellipsis", // Add ellipsis for overflow text
          }}
        >
          {errorMessage}
        </div>
      );
    }
  };

  const handleSubnetScan = async () => {
    setIsProcessing(true); // Start processing
    try {
      // Call the backend to scan the subnet
      const response = await fetch(`https://${hostIP}:9909/scan-subnet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subnet }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Subnet found! Proceeding with configuration...');

        // Call the backend to update the configuration file
        const configUpdateResponse = await fetch(`https://${hostIP}:9909/pxe-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subnet }),
        });

        const configData = await configUpdateResponse.json();

        if (configData.success) {
          messageApi.success('Subnet updated successfully!');
        } else {
          messageApi.error('Failed to update subnet.');
        }
      } else {
        messageApi.error('Subnet not found!');
      }
    } catch (error) {
      messageApi.error('Error while scanning subnet');
    } finally {
      setIsProcessing(false); // End processing
    }
    scanNetwork(subnet); // Scan using the entered subnet
    setWarningMessage(null); // Clear the warning message when a scan starts
  };

  const handleRefresh = () => {
    scanNetwork();
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      ...getColumnSearchProps("ip"),
    },
    {
      title: "MAC Address",
      dataIndex: "mac",
      key: "mac",
      ...getColumnSearchProps("mac"),
    },
    {
      title: "Last Seen",
      dataIndex: "last_seen",
      key: "last_seen",
      ...getColumnSearchProps("last_seen"),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <h5>
        <CloudOutlined />
        &nbsp; &nbsp;{cloudName} Cloud
      </h5>
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Deployment</Breadcrumb.Item>
        <Breadcrumb.Item>Discovery</Breadcrumb.Item>
      </Breadcrumb>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Discovery</h2>
        </div>
        <div>
          {warningMessage && (
            <Alert
              message={warningMessage}
              type="warning"
              icon={<SearchOutlined />}
              style={{
                marginLeft: "40px",
                flex: 1,
                marginBottom: "5px",
                maxWidth: "300px",
                wordBreak: "break-word",
              }}
            />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Input
            placeholder="Enter subnet"
            value={subnet}
            onChange={handleSubnetChange}
            style={{
              marginRight: "8px",  // Reduced margin to move closer to buttons
              marginBottom: "9px"
            }}
            autoFocus
          />
          <Button
            type="primary"
            style={{
              marginRight: "8px",
              marginBottom: "9px",
              width: "100px",
            }}
            onClick={handleSubnetScan}
            disabled={!subnet}
          >
            Scan Subnet
          </Button>
          <Button
            type="default"
            style={{
              width: "120px",
              marginRight: "100px",
              marginBottom: "9px",
            }}
            onClick={handleDefaultSubnetScan}
          >
            Default Subnet
          </Button>
          <Button
            size="middle"
            style={{
              marginLeft: "8px",
              width: "75px",
              marginBottom: "9px"
            }}
            type="primary"
            onClick={handleNextClick}
            disabled={selectedNodes.length === 0}
          >
            Next
          </Button>
        </div>
      </div>
      <Divider />
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
    type: 'radio', // Allow only one selection (radio button style)
    onChange: (_, selectedNodes) => setSelectedNodes(selectedNodes),
    selectedRowKeys: selectedNodes.length ? [selectedNodes[0].ip] : [], // This ensures only one row is selected
  }}
	  loading={{
          spinning: isScanning,
          tip: "Scanning...",
        }}
      />
    </div>
  );
};

export const Discovery = ({ onNodeSelect }) => {
  return <DataTable onNodeSelect={onNodeSelect} />;
};

export default Discovery;
