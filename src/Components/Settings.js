import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
import SettingsModal from "./SettingsModal";
import { Button, Card, Row, Col, Switch, InputNumber } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import "animate.css";

const Settings = (props) => {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  useEffect(() => {
    return () => {
      removeQueryParams();
    };
  }, []);

  const removeQueryParams = () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.hash
    );
  };

  const onPropChange = (checked, dataSet, type) => {
    const selectedStationsCopy = [...props.selectedStations];
    const index = selectedStationsCopy.findIndex(
      (selectedStation) => selectedStation.id === dataSet.id
    );

    selectedStationsCopy[index] = { ...selectedStationsCopy[index] };
    selectedStationsCopy[index][type] = checked;
    props.onStationEdit(selectedStationsCopy[index]);
  };

  return (
    <div
      className={props.settingsClass}
      style={{
        overflow: "auto",
        height: "100%",
        backgroundColor: "lightgray",
        margin: "16px",
        padding: "16px",
        borderRadius: "20px",
        position: "relative",
      }}
    >
      <Row gutter={[16, 16]}>
        {props.selectedStations.map((station) => {
          return (
            <Col key={station.id}>
              <Card
                style={{ boxShadow: "3px 3px 10px 0px rgba(0,0,0,0.5)" }}
                size="small"
                title={
                  <div style={{ display: "flex" }}>
                    <div style={{ marginRight: "8px" }}>{station.value}</div>
                    <div
                      onClick={() => {
                        props.removeStation(station);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <DeleteOutlined
                        style={{ color: "red", fontSize: "16px" }}
                      />
                    </div>
                  </div>
                }
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      S-Bahn:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "suburban");
                      }}
                      checked={station.suburban}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      U-Bahn:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "subway");
                      }}
                      checked={station.subway}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      Tram:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "tram");
                      }}
                      checked={station.tram}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      Bus:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "bus");
                      }}
                      checked={station.bus}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      Fähre:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "ferry");
                      }}
                      checked={station.ferry}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      IC/ICE:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "express");
                      }}
                      checked={station.express}
                    />
                  </div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "60px",
                      }}
                    >
                      RB/RE:
                    </div>
                    <Switch
                      onChange={(checked) => {
                        onPropChange(checked, station, "regional");
                      }}
                      checked={station.regional}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "150px",
                      }}
                    >
                      Zeitpuffer (z.B. Fußweg zur Station):
                    </div>
                    <InputNumber
                      value={station.when}
                      onChange={(value) => {
                        onPropChange(value, station, "when");
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        marginRight: "8px",
                        width: "150px",
                      }}
                    >
                      Anzahl der Ergebnisse:
                    </div>
                    <InputNumber
                      value={station.results}
                      onChange={(value) => {
                        onPropChange(value, station, "results");
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
        <Col
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={() => {
              setSettingsModalVisible(true);
            }}
            style={{
              backgroundColor: "#f0d722",
              boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.5)",
            }}
            icon={<PlusOutlined />}
          >
            Station hinzufügen
          </Button>
        </Col>
      </Row>

      <SettingsModal
        settingsModalVisible={settingsModalVisible}
        setSettingsModalVisible={setSettingsModalVisible}
        selectedStations={props.selectedStations}
        onStationSelect={props.onStationSelect}
      />
    </div>
  );
};

export default Settings;
