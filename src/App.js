import React, { useEffect, useState } from "react";
import Settings from "./Components/Settings";
import Icon, {
  SettingOutlined,
  ArrowRightOutlined,
  ExportOutlined,
  CopyOutlined,
  FontSizeOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import bvgIcon from "./images/BVG.png";
import DepartureDisplay from "./Components/DepartureDisplay";
import { Button, Input, Popover, message } from "antd";

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedStations, setSelectedStations] = useState([]);
  const [settingsAreVisible, setSettingsAreVisible] = useState(false);
  const [settingsClass, setSettingsClass] = useState(
    "animate__animated animate__backInRight"
  );
  const [apiIsAvailable, setApiIsAvailable] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    checkIfApiIsAvailable();
    const apiAvailableInterval = setInterval(() => {
      checkIfApiIsAvailable();
    }, 300000);

    fetchStationData();

    return () => {
      clearInterval(apiAvailableInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedStations.length > 0) {
      buildUrlOutOfSelectedStations(selectedStations);
    } else {
      setExportUrl("");
    }
  }, [selectedStations]);

  const fetchStationData = () => {
    if (urlHasParams()) {
      // fetch data from url
      getUrlParams();
    } else {
      // fetch data from cookie
      fetchStationsFromCookie();
      fetchFontSizeFromCookie();
    }
  };

  const buildUrlOutOfSelectedStations = (stationData) => {
    // this function build a url for export out of the stationData
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("id");
    urlParams.delete("bus");
    urlParams.delete("express");
    urlParams.delete("ferry");
    urlParams.delete("regional");
    urlParams.delete("suburban");
    urlParams.delete("subway");
    urlParams.delete("tram");
    urlParams.delete("value");
    urlParams.delete("when");
    urlParams.delete("results");
    urlParams.delete("fontSize");

    stationData.forEach((station) => {
      urlParams.append("id", station.id);
      urlParams.append("bus", station.bus);
      urlParams.append("express", station.express);
      urlParams.append("ferry", station.ferry);
      urlParams.append("regional", station.regional);
      urlParams.append("suburban", station.suburban);
      urlParams.append("subway", station.subway);
      urlParams.append("tram", station.tram);
      urlParams.append("value", station.value);
      urlParams.append("when", station.when);
      urlParams.append("results", station.results);
      urlParams.append("fontSize", fontSize);
    });

    setExportUrl(`${window.location.origin}?${urlParams.toString()}`);
  };

  const urlHasParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.keys().next().done === false;
  };

  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);

    const id = urlParams.getAll("id");
    const bus = urlParams.getAll("bus");
    const express = urlParams.getAll("express");
    const ferry = urlParams.getAll("ferry");
    const regional = urlParams.getAll("regional");
    const suburban = urlParams.getAll("suburban");
    const subway = urlParams.getAll("subway");
    const tram = urlParams.getAll("tram");
    const value = urlParams.getAll("value");
    const when = urlParams.getAll("when");
    const results = urlParams.getAll("results");

    const fontSize = urlParams.get("fontSize");
    setFontSize(fontSize);

    const fromUrlRetrievedStations = id.map((_, index) => {
      return {
        bus: bus[index] === "true",
        express: express[index] === "true",
        ferry: ferry[index] === "true",
        id: id[index],
        regional: regional[index] === "true",
        suburban: suburban[index] === "true",
        subway: subway[index] === "true",
        tram: tram[index] === "true",
        value: value[index],
        when: when[index] === "null" ? null : when[index],
        results: results[index],
      };
    });

    setSelectedStations(fromUrlRetrievedStations);
  };

  const checkIfApiIsAvailable = () => {
    // check if API is available by fetching a stop
    fetch("https://v6.db.transport.rest/stops/8011113/departures")
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

  const fetchFontSizeFromCookie = () => {
    const cookieFontSize = document.cookie.replace(
      /(?:(?:^|.*;\s*)fontSize\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    if (cookieFontSize) {
      setFontSize(parseInt(cookieFontSize));
    }
  };

  const saveFontSizeInCookie = (cookieName, data) => {
    const cookieFontSize = `${cookieName}=${JSON.stringify(
      data
    )};path=/;expires=${new Date(Date.now() + 31536000000).toUTCString()}`;
    console.log(cookieFontSize);
    document.cookie = cookieFontSize;
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

  const saveStationsInCookie = (cookieName, data) => {
    const cookieString = `${cookieName}=${JSON.stringify(
      data
    )};path=/;expires=${new Date(Date.now() + 31536000000).toUTCString()}`;
    document.cookie = cookieString;
  };

  const onStationSelect = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    selectedStationsCopy.push(dataSet);
    setSelectedStations(selectedStationsCopy);

    saveStationsInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const onStationEdit = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    const index = selectedStationsCopy.findIndex(
      (selectedStation) => selectedStation.id === dataSet.id
    );
    selectedStationsCopy[index] = dataSet;
    setSelectedStations(selectedStationsCopy);

    saveStationsInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const removeStation = (station) => {
    const updatedSelectedStations = selectedStations.filter(
      (selectedStation) => selectedStation.id !== station.id
    );
    setSelectedStations(updatedSelectedStations);

    saveStationsInCookie(
      "bvgDepatureSelectedStations",
      updatedSelectedStations
    );
  };

  const copyExportUrlToClipboard = () => {
    navigator.clipboard
      .writeText(exportUrl)
      .then(() => {
        messageApi.open({
          type: "success",
          content: "Export-URL in die Zwischenablage kopiert!",
        });
      })
      .catch((error) => {
        messageApi.open({
          type: "error",
          content: `Export-URL konnte nicht in die Zwischenablage kopiert werden! (${error}})`,
        });
      });
  };

  const renderTopSettingsIcon = () => {
    return (
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
        {!settingsAreVisible ? (
          <SettingOutlined style={{ fontSize: "32px", color: "#f0d722" }} />
        ) : (
          <ArrowRightOutlined style={{ fontSize: "32px", color: "#f0d722" }} />
        )}
      </div>
    );
  };

  const renderMidSettingsIcon = () => {
    return (
      <div
        style={{
          color: "#f0d722",
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
        <div style={{ marginRight: "8px" }}>Stationen konfigurieren:</div>
        <SettingOutlined style={{ fontSize: "32px", color: "#f0d722" }} />
      </div>
    );
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
      {contextHolder}
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
          <div>
            <Popover
              title="Schriftgröße Anzeigetafel"
              trigger="click"
              content={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                  }}
                >
                  <div>
                    <Button
                      onClick={() => {
                        setFontSize((prev) => prev + 2);
                        saveFontSizeInCookie("fontSize", fontSize + 2);
                      }}
                      icon={<PlusOutlined />}
                    />
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        setFontSize((prev) => prev - 2);
                        saveFontSizeInCookie("fontSize", fontSize - 2);
                      }}
                      icon={<MinusOutlined />}
                    />
                  </div>
                </div>
              }
            >
              <FontSizeOutlined
                style={{
                  fontSize: "32px",
                  color: "#f0d722",
                  marginRight: "24px",
                }}
              />
            </Popover>
          </div>
          <div>
            <Popover
              title="Einstellungen exportieren"
              content={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div>
                    <Input value={exportUrl} />
                  </div>
                  <div
                    onClick={copyExportUrlToClipboard}
                    style={{ marginLeft: "8px", cursor: "pointer" }}
                  >
                    <CopyOutlined style={{ fontSize: "24px" }} />
                  </div>
                </div>
              }
              trigger="click"
            >
              <ExportOutlined
                rotate={270}
                style={{
                  fontSize: "32px",
                  color: "#f0d722",
                  marginRight: "24px",
                }}
              />
            </Popover>
          </div>
          {renderTopSettingsIcon()}
        </div>
      </div>
      {!settingsAreVisible && selectedStations.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {renderMidSettingsIcon()}
        </div>
      )}
      {!settingsAreVisible && selectedStations.length > 0 && (
        <div style={{ padding: "8px", overflow: "auto" }}>
          <DepartureDisplay
            fontSize={fontSize}
            selectedStations={selectedStations}
          />
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
