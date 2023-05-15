import React from "react";
import { Modal, Button, Typography, Tag, InputNumber } from "antd";
import StationFinder from "../Components/StationFinder";

const SettingsModal = (props) => {
  const { Text } = Typography;

  const renderSelectedStations = () => {
    const { selectedStations } = props;

    return (
      <div style={{ marginTop: "8px" }}>
        {selectedStations.map((station) => {
          return (
            <Tag
              key={station.value}
              closable
              onClose={() => {
                props.removeStation(station);
              }}
            >
              {station.value}
            </Tag>
          );
        })}
      </div>
    );
  };

  return (
    <Modal
      closable={false}
      title="Einstellungen"
      open={props.settingsModalVisible}
      footer={[
        <Button
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
          Wähle die Stationen, die dich interessieren:
        </Text>
        <StationFinder
          onSelect={props.onStationSelect}
          selectedStations={props.selectedStations}
        />
        {renderSelectedStations()}
        <Text style={{ marginTop: "8px", marginBottom: "8px" }}>
          Zeitpuffer (z.B. Fußweg zur Station):
        </Text>
        <InputNumber
          defaultValue={props.departureWhen}
          controls={false}
          onChange={(value) => {
            props.onDepartureWhenChange(value);
          }}
          style={{ width: "100px" }}
        />
        <Text style={{ marginTop: "8px", marginBottom: "8px" }}>
          Anzahl an Abfahrten:
        </Text>
        <InputNumber
          defaultValue={props.departureAmount}
          controls={false}
          onChange={(value) => {
            props.onDepartureAmountChange(value);
          }}
          style={{ width: "100px" }}
        />
      </div>
    </Modal>
  );
};

export default SettingsModal;
