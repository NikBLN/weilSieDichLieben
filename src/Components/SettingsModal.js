import React from "react";
import { Modal, Button, Typography } from "antd";
import StationFinder from "../Components/StationFinder";

const SettingsModal = (props) => {
  const { Text } = Typography;

  return (
    <Modal
      closable={false}
      title="Station hinzufügen"
      open={props.settingsModalVisible}
      footer={[
        <Button
          style={{ backgroundColor: "#f0d722" }}
          key={"close"}
          onClick={() => {
            props.setSettingsModalVisible(false);
          }}
        >
          Schließen
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Text style={{ marginTop: "8px", marginBottom: "8px" }}>
          Gib den Namen einer Station ein:
        </Text>
        <StationFinder
          onSelect={props.onStationSelect}
          selectedStations={props.selectedStations}
        />
      </div>
    </Modal>
  );
};

export default SettingsModal;
