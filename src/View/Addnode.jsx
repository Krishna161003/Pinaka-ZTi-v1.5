import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import Zti from "../Components/Zti.jsx"
import Discovery from '../Components/Cloud/Discovery.jsx';
import NodeValidation from '../Components/Cloud/validate.jsx';
import LicenseActivation from '../Components/Cloud/licenseactivation.jsx';
// Placeholder components for new tabs

const App = () => {
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize from sessionStorage or URL query param if available
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) return tabParam;
    const savedTab = sessionStorage.getItem("cloud_activeTab");
    return savedTab || "1";
  }); // Only use cloud_activeTab for Cloud
  const [disabledTabs, setDisabledTabs] = useState(() => {
    const saved = sessionStorage.getItem("cloud_disabledTabs");
    return saved ? JSON.parse(saved) : { "2": true, "3": true };
  });

  // Selected nodes for validation
  const [selectedNodes, setSelectedNodes] = useState([]);
  // Nodes that passed validation for license activation
  const [licenseNodes, setLicenseNodes] = useState([]);

  // Update URL when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("cloud_activeTab", activeTab);
    // Only update if URL doesn't match
    const params = new URLSearchParams(location.search);
    if (params.get("tab") !== activeTab) {
      params.set("tab", activeTab);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [activeTab, location.search, navigate]);

  // Persist disabledTabs to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("cloud_disabledTabs", JSON.stringify(disabledTabs));
  }, [disabledTabs]);

  // Restore state on mount & on location.search change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const pathWithTab = `/addnode?tab=${tabParam || activeTab}`;
    // On mount, update lastZtiPath
    sessionStorage.setItem("lastZtiPath", pathWithTab);
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    const savedDisabled = sessionStorage.getItem("cloud_disabledTabs");
    if (savedDisabled) setDisabledTabs(JSON.parse(savedDisabled));
    return () => {
      // On unmount, save current path (with tab param) for menu memory
      const params = new URLSearchParams(location.search);
      const tabParam = params.get("tab") || activeTab;
      const pathWithTab = `/addnode?tab=${tabParam}`;
      sessionStorage.setItem("lastAddnodePath", pathWithTab);
      sessionStorage.setItem("lastMenuPath", pathWithTab); // For sidebar restore
      sessionStorage.setItem("addnode_activeTab", "1");
      sessionStorage.setItem("lastZtiPath", pathWithTab);
    };
  }, [location.search]);

  // When Discovery Next is clicked, enable Validation tab and switch to it
  const handleDiscoveryNext = (nodes) => {
    setSelectedNodes(nodes);
    setDisabledTabs((prev) => ({ ...prev, "2": false }));
    setActiveTab("2");
  };

  // When Validation Next is clicked, enable License tab and switch to it
  const handleValidationNext = (passedNodes) => {
    setLicenseNodes(passedNodes);
    setDisabledTabs((prev) => ({ ...prev, "3": false }));
    setActiveTab("3");
  };

  // When user manually clicks a tab
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // On mount, save last visited menu path for Zti main menu
  useEffect(() => {
    sessionStorage.setItem("lastMenuPath", window.location.pathname + window.location.search);
  }, []);

  return (
    <Zti>
      <h2>Add Node</h2>
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <Tabs.TabPane tab="Discovery" key="1" disabled={disabledTabs["1"]}>
          <Discovery onNext={handleDiscoveryNext} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Node Validation" key="2" disabled={disabledTabs["2"]}>
          <NodeValidation nodes={selectedNodes} onNext={handleValidationNext} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="License Activate" key="3" disabled={disabledTabs["3"]}>
          <LicenseActivation nodes={licenseNodes} />
        </Tabs.TabPane>
      </Tabs>
    </Zti>
  );
};

export default App;
