import React, { useEffect, useState } from "react";
import Settings from "./Components/Settings";
import Icon, { SettingOutlined, ArrowRightOutlined } from "@ant-design/icons";
import bvgIcon from "./images/BVG.png";
import DepartureDisplay from "./Components/DepartureDisplay";

function App() {
  const [selectedStations, setSelectedStations] = useState([]);
  const [settingsAreVisible, setSettingsAreVisible] = useState(false);
  const [settingsClass, setSettingsClass] = useState(
    "animate__animated animate__backInRight"
  );
  const [apiIsAvailable, setApiIsAvailable] = useState(false);

  useEffect(() => {
    checkIfApiIsAvailable();

    const apiAvailableInterval = setInterval(() => {
      checkIfApiIsAvailable();
    }, 300000);

    fetchStationsFromCookie();

    return () => {
      clearInterval(apiAvailableInterval);
    };
  }, []);

  const checkIfApiIsAvailable = () => {
    fetch("https://v6.bvg.transport.rest/")
      .then((response) => {
        if (response.status === 200) {
          setApiIsAvailable(true);
        } else {
          setApiIsAvailable(false);
        }
      })
      .catch((error) => {
        console.error("Error checking API availability:", error);
        setApiIsAvailable(false);
      });
  };

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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "black",
      }}
    >
      <div style={{ display: "flex", padding: "8px" }}>
        <div
          style={{
            width: "33.33%",
            marginRight: "8px",
            color: "#f0d722",
          }}
        >
          {apiIsAvailable
            ? ""
            : "Es scheint aktuell ein Problem mit der Datenschnittstelle zu geben, weshalb die Website nicht wie gewohnt funktioniert. Wir müssen uns leider gedulden."}
        </div>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              setSettingsClass(
                settingsAreVisible
                  ? "animate__animated animate__backOutRight"
                  : "animate__animated animate__backInRight"
              );
              setTimeout(
                () => {
                  setSettingsAreVisible(!settingsAreVisible);
                },
                settingsAreVisible ? 500 : 0
              );
            }}
          >
            <div
              style={{
                marginRight: "8px",
                color: "#f0d722",
              }}
            >
              {!settingsAreVisible ? "Einstellungen" : "Zurück"}
            </div>
            {!settingsAreVisible ? (
              <SettingOutlined style={{ fontSize: "32px", color: "#f0d722" }} />
            ) : (
              <ArrowRightOutlined
                style={{ fontSize: "32px", color: "#f0d722" }}
              />
            )}
          </div>
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
        <div style={{ padding: "8px", overflow: "auto" }}>
          <DepartureDisplay selectedStations={selectedStations} />
        </div>
      )}
      {settingsAreVisible && (
        <Settings
          settingsClass={settingsClass}
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
