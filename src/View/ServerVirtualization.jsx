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
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    // Initialize activeTab from sessionStorage or default to "1"
    const savedTab = sessionStorage.getItem("activeTab");
    return savedTab || "1";
  });

  const [disabledTabs, setDisabledTabs] = useState(() => {
    // Initialize disabledTabs from sessionStorage or default
    const savedDisabledTabs = sessionStorage.getItem("disabledTabs");
    return savedDisabledTabs ? JSON.parse(savedDisabledTabs) : { "2": false, "3": false, "4": false, "5": false, "6": false };
  });

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [ibn, setIbn] = useState("");

  // On component mount, restore state and query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabKey = params.get("tab") || activeTab; // Default to saved tab
    setActiveTab(tabKey);

    const savedNodes = sessionStorage.getItem("selectedNodes");
    const savedIbn = sessionStorage.getItem("ibn");

    if (savedNodes) setSelectedNodes(JSON.parse(savedNodes));
    if (savedIbn) setIbn(savedIbn);
  }, [location.search]);

  // Persist activeTab in sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("activeTab", activeTab);
    navigate(`?tab=${activeTab}`); // Update query params in URL
  }, [activeTab, navigate]);

  // Persist disabledTabs in sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("disabledTabs", JSON.stringify(disabledTabs));
  }, [disabledTabs]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleTabStart = (currentTab) => {
    const nextTab = (currentTab + 1).toString();
    setDisabledTabs((prevState) => ({
      ...prevState,
      [nextTab]: false,
    }));
    handleTabChange(nextTab);
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
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.TabPane tab="Deployment Options" key="1">
          <DeploymentOptions onStart={() => handleTabStart(1)} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Validation" key="2" disabled={disabledTabs["2"]}>
          <Validation
            next={handleNextButtonClick}
            nodes={selectedNodes}
            onStart={() => handleTabStart(3)}
            onIbnUpdate={handleIbnUpdate}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="System Interface" key="3" disabled={disabledTabs["3"]}>
          <Discovery onStart={() => handleTabStart(2)} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Activate Key" key="4" disabled={disabledTabs["4"]}>
          <ActivateKey />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Deployment" key="5" disabled={disabledTabs["5"]}>
          <Deployment />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Report" key="6" disabled={disabledTabs["6"]}>
          <Report ibn={ibn} />
        </Tabs.TabPane>
      </Tabs>
    </Zti>
  );
};

export default App;
