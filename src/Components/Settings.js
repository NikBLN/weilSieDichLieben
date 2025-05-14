import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
import SettingsModal from "./SettingsModal";
import { Button, Card, Row, Col, Switch, InputNumber, Select } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import "animate.css";
import StationFinder from "./StationFinder";
import { getTranslation } from "../dictionary";

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

  const getLanguageOptions = () => {
    const languages = [
      { value: "de", label: "Deutsch" },
      { value: "en", label: "English" },
    ];

    return languages.map((lang) => ({
      value: lang.value,
      label: lang.label,
    }));
  };

  return (
    <div
      className={props.settingsClass}
      style={{
        height: "calc(100vh - 144px)",
        backgroundColor: "lightgray",
        margin: "16px",
        marginBottom: "0px",
        borderRadius: "20px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: "1",
          padding: "16px",
          paddingBottom: "16px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Row gutter={[16, 16]} wrap={true} style={{ margin: 0 }}>
          {props.selectedStations.map((station) => {
            return (
              <Col key={station.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{ boxShadow: "3px 3px 10px 0px rgba(0,0,0,0.5)" }}
                  size="small"
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          marginRight: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {station.value}
                      </div>
                      <div
                        onClick={() => {
                          props.removeStation(station);
                        }}
                        style={{ cursor: "pointer", flexShrink: 0 }}
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
                        {getTranslation(props.language, "subway")}
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
                        {getTranslation(props.language, "ferry")}
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
                        {getTranslation(
                          props.language,
                          "showDeparturesInDirection"
                        )}
                      </div>
                      <StationFinder
                        allowClear={true}
                        initialValue={station.destination?.name}
                        onSelect={(value) => {
                          onPropChange(
                            value != null
                              ? {
                                  id: value.id,
                                  name: value.value,
                                }
                              : null,
                            station,
                            "destination"
                          );
                        }}
                        selectedStations={props.selectedStations}
                        language={props.language}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          marginRight: "8px",
                          width: "150px",
                        }}
                      >
                        {getTranslation(
                          props.language,
                          "showDeparturesInMinutes"
                        )}
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
                        {getTranslation(props.language, "amountOfResults")}
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
              {getTranslation(props.language, "addStation")}
            </Button>
          </Col>
        </Row>

        <SettingsModal
          settingsModalVisible={settingsModalVisible}
          setSettingsModalVisible={setSettingsModalVisible}
          selectedStations={props.selectedStations}
          onStationSelect={props.onStationSelect}
          language={props.language}
        />
      </div>
      <div
        style={{
          padding: "16px",
          flexShrink: 0,
          height: "auto",
          minHeight: "100px",
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "lightgray",
          position: "sticky",
          bottom: 0,
          zIndex: 1,
        }}
      >
        <Card
          style={{
            boxShadow: "3px 3px 10px 0px rgba(0,0,0,0.5)",
            height: "100%",
          }}
          size="small"
          title={getTranslation(props.language, "generalSettings")}
        >
          <div
            style={{
              display: "flex",
              marginBottom: "8px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                marginRight: "8px",
              }}
            >
              {getTranslation(props.language, "language")}
            </div>
            <Select
              options={getLanguageOptions()}
              value={props.language}
              onChange={(value) => {
                props.onLanguageChange(value);
              }}
              style={{ width: "120px" }}
            />
          </div>
          <div style={{ display: "flex", marginBottom: "8px" }}>
            <div
              style={{
                marginRight: "8px",
              }}
            >
              {getTranslation(props.language, "showRemarks")}
            </div>
            <Switch
              onChange={(checked) => {
                props.onRemarksVisibilityChange(checked);
              }}
              checked={props.remarksVisibility}
            />
          </div>
          <div style={{ display: "flex", marginBottom: "8px" }}>
            <div style={{ marginRight: "8px" }}>
              {getTranslation(props.language, "showStandardRemarks")}
            </div>
            <Switch
              onChange={(checked) => {
                props.onStandardRemarksVisibilityChange(checked);
              }}
              checked={props.standardRemarksVisibility}
            />
          </div>
          <div style={{ display: "flex", marginBottom: "8px" }}>
            <div style={{ marginRight: "8px" }}>
              {getTranslation(props.language, "hideHeaderFooter")}
            </div>
            <Switch
              onChange={(checked) => {
                props.onAutoHideChange(checked);
              }}
              checked={props.autoHideEnabled}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
