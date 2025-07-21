import React, { useState, useEffect } from "react";
import { Tabs } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import Zti from "../Components/Zti";
import DeploymentOptions from "../Components/ServerVirtualization/Deployop";
import Discovery from "../Components/ServerVirtualization/NwtScan";
import Validation from "../Components/ServerVirtualization/Validate";
import Report from "../Components/ServerVirtualization/Report";
import ActivateKey from "../Components/ServerVirtualization/ActivateKey";
import Deployment from "../Components/ServerVirtualization/Deployment";

const App = () => {
  const hostIP = window.location.hostname;
  // Auto-redirect to Report tab if deployment in progress
  useEffect(() => {
    // Use loginDetails for user ID
    const loginDetails = JSON.parse(sessionStorage.getItem("loginDetails"));
    const userId = loginDetails?.data?.id;
    if (!userId) return;
    fetch(`https://${hostIP}:5000/api/deployment-activity-log/latest-in-progress/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.inProgress) {
          setActiveTab("6");
          setDisabledTabs({
            "1": true,
            "2": true,
            "3": true,
            "4": true,
            "5": true,
            "6": false
          });
          // Update the URL to tab=6 if not already
          navigate("?tab=6", { replace: true });
        }
      })
      .catch(err => {
        // Optionally handle error
        console.error("Error checking deployment progress", err);
      });
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    // Initialize activeTab from sessionStorage or default to "1"
    const savedTab = sessionStorage.getItem("activeTab");
    return savedTab || "1";
  });

  const [disabledTabs, setDisabledTabs] = useState(() => {
    // By default, only Deployment Options is enabled; all others disabled
    return { "2": true, "3": true, "4": true, "5": true, "6": true };
  });

  // On initial mount, force disabledTabs to default (only Deployment Options enabled)
  useEffect(() => {
    setDisabledTabs({ "2": true, "3": true, "4": true, "5": true, "6": true });
    sessionStorage.setItem("disabledTabs", JSON.stringify({ "2": true, "3": true, "4": true, "5": true, "6": true }));
  }, []);

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [ibn, setIbn] = useState("");

  // On component mount, restore state and query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabKey = params.get("tab") || activeTab; // Default to saved tab
    setActiveTab(tabKey);

    // Restore disabledTabs from sessionStorage if present
    const savedDisabledTabs = sessionStorage.getItem("disabledTabs");
    let parsedDisabledTabs = savedDisabledTabs ? JSON.parse(savedDisabledTabs) : null;
    // If last active tab was Report, ensure tab 1 stays disabled
    if (tabKey === "6") {
      parsedDisabledTabs = { ...(parsedDisabledTabs || {}), "1": true, "6": false };
    }
    if (parsedDisabledTabs) setDisabledTabs(parsedDisabledTabs);

    const savedNodes = sessionStorage.getItem("selectedNodes");
    const savedIbn = sessionStorage.getItem("ibn");

    if (savedNodes) setSelectedNodes(JSON.parse(savedNodes));
    if (savedIbn) setIbn(savedIbn);
  }, [location.search]);

  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
    navigate(`?tab=${activeTab}`); // Update query params in URL
  }, [activeTab, navigate]);

  useEffect(() => {
    sessionStorage.setItem("disabledTabs", JSON.stringify(disabledTabs));
  }, [disabledTabs]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Handler to enable only Validation tab after Deployment Option modal is confirmed
  const handleDeploymentStart = (cloudName) => {
    setDisabledTabs({
      "2": false, // Enable Validation
      "3": true,
      "4": true,
      "5": true,
      "6": true,
    });
    setActiveTab("2"); // Optionally switch to Validation tab
    // Optionally store cloudName if needed
  };

  const handleIbnUpdate = (newIbn) => {
    setIbn(newIbn);
    sessionStorage.setItem("ibn", newIbn); // Persist to sessionStorage
    setDisabledTabs((prevState) => ({
      ...prevState,
      "4": false,
    }));
  };

  const handleNextButtonClick = () => {
    handleTabChange("4");
  };


  return (
    <Zti>
      <h2 style={{ userSelect: "none" }}>Server Virtualization</h2>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          if (key === "6") {
            setDisabledTabs({
              "1": true,
              "2": true,
              "3": true,
              "4": true,
              "5": true,
              "6": false
            });
          }
        }}
      >
        <Tabs.TabPane tab="Deployment Options" key="1" disabled={disabledTabs["1"]}>
          <DeploymentOptions onStart={handleDeploymentStart} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Validation" key="2" disabled={disabledTabs["2"]}>
          <Validation
            next={() => {
              setDisabledTabs((prev) => ({ ...prev, "3": false }));
              setActiveTab("3");
            }}
            onValidationResult={(result) => {
              if (result === "failed") {
                setDisabledTabs({
                  "2": false,
                  "3": true,
                  "4": true,
                  "5": true,
                  "6": true,
                });
              }
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="System Interface" key="3" disabled={disabledTabs["3"]}>
          <Discovery next={() => {
            setDisabledTabs(prev => ({
              ...prev,
              "2": false, // Validation enabled
              "3": false, // System Interface enabled
              "4": false  // Activate Key enabled
            }));
            setActiveTab("4");
          }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Activate Key" key="4" disabled={disabledTabs["4"]}>
          <ActivateKey
            next={() => {
              setDisabledTabs(prev => ({
                ...prev,
                "5": false, // Enable Deployment tab
              }));
              setActiveTab("5");
            }}
            onValidationResult={(result) => {
              if (result === "failed") {
                setDisabledTabs(prev => ({
                  ...prev,
                  "5": true // Disable Deployment tab if validation fails
                }));
              }
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Deployment" key="5" disabled={disabledTabs["5"]}>
          <Deployment next={() => {
            setDisabledTabs({
              "1": true,
              "2": true,
              "3": true,
              "4": true,
              "5": true,
              "6": false
            });
            setActiveTab("6");
          }} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Report" key="6" disabled={disabledTabs["6"]}>
          <Report ibn={ibn} onDeploymentComplete={() => {
            setActiveTab("1");
            setDisabledTabs({ "2": true, "3": true, "4": true, "5": true, "6": true });
            sessionStorage.setItem("activeTab", "1");
            sessionStorage.setItem("disabledTabs", JSON.stringify({ "2": true, "3": true, "4": true, "5": true, "6": true }));
          }} />
        </Tabs.TabPane>
      </Tabs>
    </Zti>
  );
};

export default App;
