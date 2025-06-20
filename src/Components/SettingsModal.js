import React from "react";
import { Modal, Button, Typography } from "antd";
import StationFinder from "../Components/StationFinder";
import { getTranslation } from "../dictionary";

const SettingsModal = (props) => {
  const { Text } = Typography;

  return (
    <Modal
      closable={false}
      title={getTranslation(props.language, "addStation")}
      open={props.settingsModalVisible}
      footer={[
        <Button
          style={{ backgroundColor: "#f0d722" }}
          key={"close"}
          onClick={() => {
            props.setSettingsModalVisible(false);
          }}
        >
          {getTranslation(props.language, "close")}
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Text style={{ marginTop: "8px", marginBottom: "8px" }}>
          {getTranslation(props.language, "provideStationName")}
        </Text>
        <StationFinder
          onSelect={props.onStationSelect}
          selectedStations={props.selectedStations}
          language={props.language}
        />
      </div>
    </Modal>
  );
};

export default SettingsModal;
