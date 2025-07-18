import React, { useState } from 'react';
import { Tabs } from 'antd';
import Zti from "../Components/Zti"
import DeploymentOptions from '../Components/Cloud/Cloud.jsx';

// Placeholder components for new tabs
const Validation = () => <div>Validation Content</div>;
const Report = () => <div>Report Content</div>;

const App = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [disabledTabs, setDisabledTabs] = useState({ "2": true, "3": true });

  const handleTabStart = (currentTab) => {
    const nextTab = (currentTab + 1).toString();
    setDisabledTabs((prevState) => ({
      ...prevState,
      [nextTab]: false,
    }));
    setActiveTab(nextTab);
  };

  return (
    <Zti>
      <h2>Cloud</h2>
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
        <Tabs.TabPane tab="Deployment Options" key="1" disabled={disabledTabs["1"]}>
          <DeploymentOptions onStart={() => handleTabStart(1)} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Validation" key="2" disabled={disabledTabs["2"]}>
          <Validation />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Report" key="3" disabled={disabledTabs["3"]}>
          <Report />
        </Tabs.TabPane>
      </Tabs>
    </Zti>
  );
};

export default App;
