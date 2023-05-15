import React, { useState } from "react";
import { SettingOutlined } from "@ant-design/icons";
import SettingsModal from "./SettingsModal";

const Settings = (props) => {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  return (
    <div>
      <SettingsModal
        departureAmount={props.departureAmount}
        departureWhen={props.departureWhen}
        onDepartureAmountChange={props.onDepartureAmountChange}
        onDepartureWhenChange={props.onDepartureWhenChange}
        settingsModalVisible={settingsModalVisible}
        setSettingsModalVisible={setSettingsModalVisible}
        onStationSelect={props.onStationSelect}
        removeStation={props.removeStation}
        selectedStations={props.selectedStations}
      />
      <SettingOutlined
        onClick={() => {
          setSettingsModalVisible(true);
        }}
        style={{ fontSize: "32px", color: "#f0d722" }}
      />
    </div>
  );
};

export default Settings;
