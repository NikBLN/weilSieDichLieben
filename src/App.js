import React, { useEffect, useState } from "react";
import Settings from "./Components/Settings";
import Icon, { SettingOutlined } from "@ant-design/icons";
import bvgIcon from "./images/BVG.png";
import DepartureDisplay from "./Components/DepartureDisplay";

function App() {
  const [selectedStations, setSelectedStations] = useState([]);
  const [settingsAreVisible, setSettingsAreVisible] = useState(false);

  useEffect(() => {
    fetchStationsFromCookie();
  }, []);

  const fetchStationsFromCookie = () => {
    const cookieSelectedStations = document.cookie.replace(
      /(?:(?:^|.*;\s*)bvgDepatureSelectedStations\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    if (cookieSelectedStations) {
      setSelectedStations(JSON.parse(cookieSelectedStations));
    }
  };

  const saveDataInCookie = (cookieName, data) => {
    const cookieString = `${cookieName}=${JSON.stringify(
      data
    )};path=/;expires=${new Date(Date.now() + 31536000000).toUTCString()}`;
    document.cookie = cookieString;
  };

  const onStationSelect = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    selectedStationsCopy.push(dataSet);
    setSelectedStations(selectedStationsCopy);

    saveDataInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const onStationEdit = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    const index = selectedStationsCopy.findIndex(
      (selectedStation) => selectedStation.id === dataSet.id
    );
    selectedStationsCopy[index] = dataSet;
    setSelectedStations(selectedStationsCopy);

    saveDataInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const removeStation = (station) => {
    const updatedSelectedStations = selectedStations.filter(
      (selectedStation) => selectedStation.id !== station.id
    );
    setSelectedStations(updatedSelectedStations);

    saveDataInCookie("bvgDepatureSelectedStations", updatedSelectedStations);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "black",
      }}
    >
      <div style={{ display: "flex", padding: "8px" }}>
        <div style={{ width: "33.33%" }}></div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "33.33%",
          }}
        >
          <Icon
            component={() => (
              <img src={bvgIcon} style={{ height: "48px" }} alt="Icon" />
            )}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "33.33%",
          }}
        >
          <SettingOutlined
            onClick={() => {
              setSettingsAreVisible(true);
            }}
            style={{ fontSize: "32px", color: "#f0d722" }}
          />
        </div>
      </div>
      {!settingsAreVisible && selectedStations.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#f0d722",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "26px",
          }}
        >
          Hallo! Klicke auf das Zahnrad oben rechts um zu beginnen.
        </div>
      )}
      {!settingsAreVisible && selectedStations.length > 0 && (
        <div style={{ padding: "8px" }}>
          <DepartureDisplay selectedStations={selectedStations} />
        </div>
      )}
      {settingsAreVisible && (
        <Settings
          setSettingsAreVisible={setSettingsAreVisible}
          selectedStations={selectedStations}
          onStationSelect={onStationSelect}
          onStationEdit={onStationEdit}
          removeStation={removeStation}
        />
      )}
    </div>
  );
}

export default App;
