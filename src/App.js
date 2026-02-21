/* eslint-disable react-hooks/exhaustive-deps */
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
  InfoCircleOutlined,
  EuroOutlined,
  GithubOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import useIsMobile from "./hooks/useIsMobile";
import bvgIcon from "./images/BVG.png";
import payPalQrCode from "./images/PayPalQrCode.png";
import DepartureDisplay from "./Components/DepartureDisplay";
import {
  Button,
  Input,
  Modal,
  Popover,
  Drawer,
  message,
  Typography,
  Space,
  notification,
} from "antd";
import DonationDisplay from "./Components/DonationDisplay";
import CookieBanner from "./Components/CookieBanner";
import LegalModals from "./Components/LegalModals";
import { getTranslation } from "./dictionary";

const App = () => {
  const [language, setLanguage] = useState("de");
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedStations, setSelectedStations] = useState([]);
  const [settingsAreVisible, setSettingsAreVisible] = useState(false);
  const [settingsClass, setSettingsClass] = useState(
    "animate__animated animate__backInRight"
  );
  const [apiIsAvailable, setApiIsAvailable] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [remarksVisibility, setRemarksVisibility] = useState(true);
  const [hideDepartureCol, setHideDepartureCol] = useState(false);
  const [standardRemarksVisibility, setStandardRemarksVisibility] =
    useState(true);
  const [autoHideEnabled, setAutoHideEnabled] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(() => {
    const stored = document.cookie.replace(
      /(?:(?:^|.*;\s*)cookieConsent\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    if (stored === "true") return true;
    if (stored === "false") return false;
    return null;
  });
  const [hamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const [fontSizeModalOpen, setFontSizeModalOpen] = useState(false);
  const autoHideTimeoutRef = React.useRef(null);
  const instanceIdCounter = React.useRef(0);
  const isMobile = useIsMobile();

  const { Title, Text } = Typography;

  useEffect(() => {
    // Init the app
    checkIfApiIsAvailable();
    const apiAvailableInterval = setInterval(() => {
      checkIfApiIsAvailable();
    }, 300000);

    fetchStationData();
    fetchAutoHideFromCookie();
    fetchFontSizeFromCookie();
    fetchRemarksVisibilityFromCookie();
    fetchHideDepartureColFromCookie();
    fetchStandardRemarksVisibilityFromCookie();
    fetchLanguageFromCookie();

    // Check notification version
    fetch(
      "https://raw.githubusercontent.com/NikBLN/weilSieDichLieben/main/notification-version.json"
    )
      .then((response) => response.json())
      .then((data) => {
        const storedVersion = cookieConsent
          ? document.cookie.replace(
              /(?:(?:^|.*;\s*)notificationVersion\s*=\s*([^;]*).*$)|^.*$/,
              "$1"
            ) || "0"
          : "0";
        if (data.version > parseInt(storedVersion)) {
          const title =
            typeof data.title === "object"
              ? data.title[language] ||
                data.title.de ||
                "Neue Features verfügbar!"
              : data.title || "Neue Features verfügbar!";
          const message =
            typeof data.message === "object"
              ? data.message[language] ||
                data.message.de ||
                "In den Einstellungen (⚙️) sind ein paar neue Einstellungen dazugekommen. Schau doch mal vorbei!"
              : data.message ||
                "In den Einstellungen (⚙️) sind ein paar neue Einstellungen dazugekommen. Schau doch mal vorbei!";

          notification.info({
            message: title,
            description: message,
            placement: "topRight",
            duration: 0,
            btn: (
              <Button
                size="small"
                onClick={() => {
                  if (cookieConsent) {
                    document.cookie = `notificationVersion=${
                      data.version
                    };path=/;expires=${new Date(
                      Date.now() + 31536000000
                    ).toUTCString()}`;
                  }
                  notification.destroy();
                }}
              >
                Nicht mehr anzeigen
              </Button>
            ),
          });
        }
      })
      .catch(console.error);

    return () => {
      clearInterval(apiAvailableInterval);
    };
  }, [cookieConsent]);

  useEffect(() => {
    // Handle export URL generation
    if (selectedStations.length > 0) {
      buildUrlOutOfSelectedStations(selectedStations);
    } else {
      setExportUrl("");
    }
  }, [selectedStations, fontSize, remarksVisibility, autoHideEnabled]);

  useEffect(() => {
    // Handle auto-hide functionality
    const handleUserActivity = () => {
      if (autoHideEnabled && !settingsAreVisible) {
        setUiVisible(true);
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
        }
        autoHideTimeoutRef.current = setTimeout(() => {
          if (!settingsAreVisible) {
            setUiVisible(false);
          }
        }, 2000);
      }
    };

    buildUrlOutOfSelectedStations(selectedStations);
    document.addEventListener("mousemove", handleUserActivity);
    document.addEventListener("touchstart", handleUserActivity);

    if (autoHideEnabled && !settingsAreVisible) {
      autoHideTimeoutRef.current = setTimeout(() => {
        setUiVisible(false);
      }, 2000);
    }

    return () => {
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("touchstart", handleUserActivity);
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [autoHideEnabled, settingsAreVisible]);

  const acceptCookies = () => {
    document.cookie = `cookieConsent=true;path=/;expires=${new Date(
      Date.now() + 31536000000
    ).toUTCString()}`;
    setCookieConsent(true);
  };

  const declineCookies = () => {
    document.cookie = `cookieConsent=false;path=/;expires=${new Date(
      Date.now() + 31536000000
    ).toUTCString()}`;
    setCookieConsent(false);
    messageApi.open({
      type: "warning",
      content: getTranslation(language, "cookiesDeclinedInfo"),
    });
  };

  const resetCookieConsent = () => {
    document.cookie =
      "cookieConsent=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setCookieConsent(null);
  };

  const fetchStationData = () => {
    if (urlHasParams()) {
      // fetch data from url
      getUrlParams();
    } else {
      // fetch data from cookie if allowed
      if (cookieConsent) {
        fetchStationsFromCookie();
        fetchFontSizeFromCookie();
        fetchRemarksVisibilityFromCookie();
      }
    }
  };

  const buildUrlOutOfSelectedStations = (stationData) => {
    // this function builds a url for export out of the stationData
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
    urlParams.delete("remarksVisibility");
    urlParams.delete("autoHide");
    urlParams.delete("destinationId");
    urlParams.delete("destinationName");

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
      urlParams.append("remarksVisibility", remarksVisibility);
      urlParams.append("autoHide", autoHideEnabled);

      if (
        station.destination?.id != null &&
        station.destination?.name != null
      ) {
        urlParams.append("destinationId", station.destination.id);
        urlParams.append("destinationName", station.destination.name);
      }
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
    const destinationId = urlParams.getAll("destinationId");
    const destinationName = urlParams.getAll("destinationName");

    const fontSize = urlParams.get("fontSize");
    setFontSize(parseInt(fontSize));

    const fromUrlRetrievedStations = id.map((_, index) => {
      return {
        instanceId: index + 1,
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
        destination:
          destinationId[index] != null && destinationName[index] != null
            ? {
                id: destinationId[index],
                name: destinationName[index],
              }
            : null,
      };
    });

    instanceIdCounter.current = fromUrlRetrievedStations.length;
    setSelectedStations(fromUrlRetrievedStations);
  };

  const checkIfApiIsAvailable = () => {
    // check if API is available by fetching a stop
    fetch("https://v6.bvg.transport.rest/stops/900017101/departures")
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

  const fetchRemarksVisibilityFromCookie = () => {
    if (!cookieConsent) return;
    const cookieRemarksVisibility = document.cookie.replace(
      /(?:(?:^|.*;\s*)remarksVisibility\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (cookieRemarksVisibility != null && cookieRemarksVisibility !== "") {
      setRemarksVisibility(JSON.parse(cookieRemarksVisibility));
    }
  };

  const fetchHideDepartureColFromCookie = () => {
    if (!cookieConsent) return;
    const cookieHideDepartureCol = document.cookie.replace(
      /(?:(?:^|.*;\s*)hideDepartureCol\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (cookieHideDepartureCol != null && cookieHideDepartureCol !== "") {
      setHideDepartureCol(JSON.parse(cookieHideDepartureCol));
    }
  };

  const fetchAutoHideFromCookie = () => {
    if (!cookieConsent) return;
    const cookieAutoHide = document.cookie.replace(
      /(?:(?:^|.*;\s*)autoHide\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (cookieAutoHide != null && cookieAutoHide !== "") {
      setAutoHideEnabled(JSON.parse(cookieAutoHide));
    }
  };

  const fetchStandardRemarksVisibilityFromCookie = () => {
    if (!cookieConsent) return;
    const cookieStandardRemarksVisibility = document.cookie.replace(
      /(?:(?:^|.*;\s*)standardRemarksVisibility\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (
      cookieStandardRemarksVisibility != null &&
      cookieStandardRemarksVisibility !== ""
    ) {
      setStandardRemarksVisibility(JSON.parse(cookieStandardRemarksVisibility));
    }
  };

  const fetchLanguageFromCookie = () => {
    if (!cookieConsent) return;
    const cookieLanguage = document.cookie.replace(
      /(?:(?:^|.*;\s*)language\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    if (cookieLanguage && cookieLanguage !== "") {
      setLanguage(JSON.parse(cookieLanguage));
    }
  };

  const onLanguageChange = (value) => {
    setLanguage(value);
    saveDataInCookie("language", value);
  };

  const onAutoHideChange = (value) => {
    setAutoHideEnabled(value);
    saveDataInCookie("autoHide", value);
    if (!value) {
      setUiVisible(true);
    }
  };

  const onRemarksVisibilityChange = (value) => {
    setRemarksVisibility(value);
    saveDataInCookie("remarksVisibility", value);
  };

  const onHideDepartureColChange = (value) => {
    setHideDepartureCol(value);
    saveDataInCookie("hideDepartureCol", value);
  };

  const onStandardRemarksVisibilityChange = (value) => {
    setStandardRemarksVisibility(value);
    saveDataInCookie("standardRemarksVisibility", value);
  };

  const fetchFontSizeFromCookie = () => {
    if (!cookieConsent) return;
    const cookieFontSize = document.cookie.replace(
      /(?:(?:^|.*;\s*)fontSize\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );

    // legacy support for users who dont have the fontSize cookie
    if (cookieFontSize !== "null" && cookieFontSize !== "") {
      setFontSize(parseInt(cookieFontSize));
    } else {
      setFontSize(16);
    }
  };

  const saveDataInCookie = (propertyName, value) => {
    if (!cookieConsent) return;
    const cookieValue = `${propertyName}=${JSON.stringify(
      value
    )};path=/;expires=${new Date(Date.now() + 31536000000).toUTCString()}`;
    document.cookie = cookieValue;
  };

  const fetchStationsFromCookie = () => {
    if (!cookieConsent) return;
    const cookieSelectedStations = document.cookie.replace(
      /(?:(?:^|.*;\s*)bvgDepatureSelectedStations\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    if (cookieSelectedStations) {
      const stations = JSON.parse(cookieSelectedStations);
      let maxId = 0;
      const migratedStations = stations.map((station, index) => {
        if (station.instanceId == null) {
          station = { ...station, instanceId: index + 1 };
        }
        maxId = Math.max(maxId, station.instanceId);
        return station;
      });
      instanceIdCounter.current = maxId;
      setSelectedStations(migratedStations);
    }
  };

  const onStationSelect = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    instanceIdCounter.current += 1;
    selectedStationsCopy.push({ ...dataSet, instanceId: instanceIdCounter.current });
    setSelectedStations(selectedStationsCopy);

    saveDataInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const onStationEdit = (dataSet) => {
    const selectedStationsCopy = [...selectedStations];
    const index = selectedStationsCopy.findIndex(
      (selectedStation) => selectedStation.instanceId === dataSet.instanceId
    );
    selectedStationsCopy[index] = dataSet;
    setSelectedStations(selectedStationsCopy);

    saveDataInCookie("bvgDepatureSelectedStations", selectedStationsCopy);
  };

  const removeStation = (station) => {
    const updatedSelectedStations = selectedStations.filter(
      (selectedStation) => selectedStation.instanceId !== station.instanceId
    );
    setSelectedStations(updatedSelectedStations);

    saveDataInCookie("bvgDepatureSelectedStations", updatedSelectedStations);
  };

  const triggerPulse = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1000);
  };

  useEffect(() => {
    const interval = setInterval(triggerPulse, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const renderInfoModal = () => (
    <Modal
      title="Informationen und Impressum"
      open={infoModalVisible}
      footer={null}
      onCancel={() => {
        setInfoModalVisible(false);
      }}
    >
      <div
        style={{
          height: "250px",
          overflow: "auto",
        }}
      >
        <Title level={5}>Bereitstellung der Daten</Title>
        <Space direction="vertical" size={1}>
          <Text>
            <a href="https://www.transport.rest">
              transport.rest transit APIs
            </a>
          </Text>
          <Text>
            Danke {<a href="https://github.com/derhuerst">Jannis</a>} für
            das Betreiben und Bereitstellen der tollen API! Schaut doch mal
            bei transport.rest vorbei!
          </Text>
        </Space>
        <Title level={5}>Allgemeines</Title>
        <Space direction="vertical" size={1}>
          <Text strong>
            Diese Website ist ein privates Projekt und wird nicht von der
            BVG betrieben.
          </Text>
        </Space>
        <Title level={5}>Angaben gemäß § 5 TMG</Title>
        <Space direction="vertical" size={1}>
          <Text>Nikolas Tsombanis</Text>
        </Space>
        <Title level={5}>Kontakt</Title>
        <Space direction="vertical" size={1}>
          <Text>
            <a href="mailto:weilsiedichlieben@posteo.de">
              weilsiedichlieben@posteo.de
            </a>
          </Text>
        </Space>
        <Title level={5}>
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
        </Title>
        <Space direction="vertical" size={1}>
          <Text>Nikolas Tsombanis</Text>
        </Space>
      </div>
    </Modal>
  );

  const renderDonationModal = () => (
    <Modal
      title={getTranslation(language, "supportProjectTitle")}
      open={donationModalVisible}
      footer={null}
      onCancel={() => setDonationModalVisible(false)}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <a href="https://www.paypal.com/donate/?hosted_button_id=R96455XKT9X8G">
          <Button style={{ marginBottom: "8px" }} type="primary">
            {getTranslation(language, "donateWithPaypal")}
          </Button>
        </a>
        <Icon
          component={() => (
            <img
              src={payPalQrCode}
              style={{ height: "100px" }}
              alt="PayPal QR Code"
            />
          )}
        />
        <Text strong>{getTranslation(language, "whyDonateH1")}</Text>
        <Text>{getTranslation(language, "whyDonateP1")}</Text>
        <Text strong>{getTranslation(language, "whyDonateH2")}</Text>
        <Text>{getTranslation(language, "whyDonateP2")}</Text>
        <Text>{getTranslation(language, "whyDonateP3")}</Text>
        <Text strong>{getTranslation(language, "whyDonateH3")}</Text>
        <Text>{getTranslation(language, "whyDonateP4")}</Text>
      </Space>
    </Modal>
  );

  const renderFontSizeModal = () => (
    <Modal
      title={getTranslation(language, "fontSize")}
      open={fontSizeModalOpen}
      footer={null}
      onCancel={() => setFontSizeModalOpen(false)}
      centered
      width={280}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", padding: "16px 0" }}>
        <Button
          size="large"
          onClick={() => {
            setFontSize((prev) => prev + 2);
            saveDataInCookie("fontSize", fontSize + 2);
          }}
          icon={<PlusOutlined />}
        />
        <Button
          size="large"
          onClick={() => {
            setFontSize((prev) => prev - 2);
            saveDataInCookie("fontSize", fontSize - 2);
          }}
          icon={<MinusOutlined />}
        />
      </div>
    </Modal>
  );

  const renderHamburgerMenu = () => (
    <>
      <MenuOutlined
        style={{ fontSize: "28px", color: "#f0d722", marginRight: "16px" }}
        onClick={() => setHamburgerMenuOpen(true)}
      />
      <Drawer
        title={getTranslation(language, "menu")}
        placement="left"
        onClose={() => setHamburgerMenuOpen(false)}
        open={hamburgerMenuOpen}
        width={280}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Info */}
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#f0d722" }}
            onClick={() => { setInfoModalVisible(true); setHamburgerMenuOpen(false); }}
          >
            <InfoCircleOutlined style={{ fontSize: "24px", marginRight: "12px" }} />
            <span>{getTranslation(language, "info")}</span>
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/NikBLN/weilSieDichLieben"
            target="_blank"
            rel="noreferrer"
            style={{ display: "flex", alignItems: "center", color: "#f0d722", textDecoration: "none" }}
          >
            <GithubOutlined style={{ fontSize: "24px", marginRight: "12px" }} />
            <span>GitHub</span>
          </a>

          {/* Font Size */}
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#f0d722" }}
            onClick={() => { setFontSizeModalOpen(true); setHamburgerMenuOpen(false); }}
          >
            <FontSizeOutlined style={{ fontSize: "24px", marginRight: "12px" }} />
            <span>{getTranslation(language, "fontSize")}</span>
          </div>

          {/* Export */}
          <div style={{ color: "#f0d722" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
              <ExportOutlined rotate={270} style={{ fontSize: "24px", marginRight: "12px" }} />
              <span>{getTranslation(language, "exportSettings")}</span>
            </div>
            <div style={{ marginLeft: "36px" }}>
              <Button
                onClick={copyExportUrlToClipboard}
                icon={<CopyOutlined />}
              >
                {getTranslation(language, "copySettingsUrl")}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );

  const renderHeaderLeftSideContent = () => {
    // Mobile: Hamburger menu only
    if (isMobile) {
      return (
        <div style={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
          {renderInfoModal()}
          {renderDonationModal()}
          {renderFontSizeModal()}
          {renderHamburgerMenu()}
          {!apiIsAvailable && (
            <span style={{ color: "#f0d722", fontSize: "12px" }}>
              API nicht verfügbar
            </span>
          )}
        </div>
      );
    }

    // Desktop: Full icons
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "33.33%",
          marginRight: "8px",
          color: "#f0d722",
        }}
      >
        {renderInfoModal()}
        {renderDonationModal()}
        <InfoCircleOutlined
          onClick={() => {
            setInfoModalVisible(true);
          }}
          style={{
            fontSize: "32px",
            color: "#f0d722",
            marginRight: "24px",
          }}
        />
        <EuroOutlined
          onClick={() => setDonationModalVisible(true)}
          style={{
            fontSize: "32px",
            color: "#f0d722",
            marginRight: "24px",
            cursor: "pointer",
          }}
        />
        <Popover
          placement="bottomLeft"
          title="Check out this project on GitHub"
          content={
            <Space
              style={{ width: "500px", overflow: "auto" }}
              direction="vertical"
              size={1}
            >
              <Text>
                If you are a developer, feel free to check out the repo of this
                project on GitHub. I'm always happy if you have a great feature
                idea and contribute to this open source project!
              </Text>
              <a
                href="https://github.com/NikBLN/weilSieDichLieben"
                target="_blank"
                rel="noreferrer"
              >
                <Button style={{ marginTop: "8px" }} type="primary">
                  Visit GitHub
                </Button>
              </a>
            </Space>
          }
          trigger="click"
        >
          <GithubOutlined
            style={{
              fontSize: "32px",
              color: "#f0d722",
              marginRight: "24px",
            }}
          />
        </Popover>
        {apiIsAvailable
          ? ""
          : "Es scheint aktuell ein Problem mit der Datenschnittstelle zu geben, weshalb die Website nicht wie gewohnt funktioniert. Wir müssen uns leider gedulden."}
      </div>
    );
  };

  const renderHeaderMidContent = () => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isMobile ? "auto" : "33.33%",
          flex: 1,
        }}
      >
        <img
          src={bvgIcon}
          style={{ height: isMobile ? "36px" : "48px" }}
          alt="Icon"
          className={isPulsing ? "pulse-animation" : ""}
        />
      </div>
    );
  };

  const renderHeaderRightSideContent = () => {
    // Mobile: Only Donation + Settings
    if (isMobile) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "0 0 auto" }}>
          <EuroOutlined
            onClick={() => setDonationModalVisible(true)}
            style={{ fontSize: "28px", color: "#f0d722", cursor: "pointer" }}
          />
          {renderTopSettingsIcon()}
        </div>
      );
    }

    // Desktop: Full icons
    return (
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
            title={getTranslation(language, "fontSize")}
            trigger="click"
            content={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                }}
              >
                <Button
                  onClick={() => {
                    setFontSize((prev) => prev + 2);
                    saveDataInCookie("fontSize", fontSize + 2);
                  }}
                  icon={<PlusOutlined />}
                />

                <Button
                  onClick={() => {
                    setFontSize((prev) => prev - 2);
                    saveDataInCookie("fontSize", fontSize - 2);
                  }}
                  icon={<MinusOutlined />}
                />
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
            placement="bottomRight"
            title={getTranslation(language, "exportSettings")}
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
      <div
        style={{
          display: "flex",
          padding: "8px",
          transform: uiVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease-in-out",
          position: "absolute",
          width: "100%",
          backgroundColor: "black",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {renderHeaderLeftSideContent()}
        {renderHeaderMidContent()}
        {renderHeaderRightSideContent()}
      </div>
      <div
        style={{
          flex: 1,
          marginTop: uiVisible ? "64px" : 0,
          transition: "margin-top 0.3s ease-in-out",
        }}
      >
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
          <div
            style={{ 
              padding: "8px", 
              overflow: "auto", 
              height: `calc(100vh - ${uiVisible ? '64px' : '0px'} - ${fontSize + 56}px)`,
              boxSizing: "border-box"
            }}
          >
            <DepartureDisplay
              fontSize={fontSize}
              selectedStations={selectedStations}
              remarksVisibility={remarksVisibility}
              hideDepartureCol={hideDepartureCol}
              standardRemarksVisibility={standardRemarksVisibility}
              language={language}
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
            remarksVisibility={remarksVisibility}
            onRemarksVisibilityChange={onRemarksVisibilityChange}
            standardRemarksVisibility={standardRemarksVisibility}
            onStandardRemarksVisibilityChange={
              onStandardRemarksVisibilityChange
            }
            autoHideEnabled={autoHideEnabled}
            onAutoHideChange={onAutoHideChange}
            hideDepartureCol={hideDepartureCol}
            onHideDepartureColChange={onHideDepartureColChange}
            language={language}
            onLanguageChange={onLanguageChange}
            onResetCookieConsent={resetCookieConsent}
          />
        )}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          transform: uiVisible && !(isMobile && settingsAreVisible) ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <DonationDisplay fontSize={fontSize} language={language} />
        <LegalModals language={language} />
      </div>
      <CookieBanner
        visible={cookieConsent === null}
        onAccept={acceptCookies}
        onDecline={declineCookies}
        language={language}
      />
    </div>
  );
};

export default App;
