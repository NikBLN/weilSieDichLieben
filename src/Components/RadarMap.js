import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import { Spin } from "antd";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getTranslation } from "../dictionary";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Constants for geographic calculations (2km radius)
const KM_TO_DEGREES_LAT = 2 / 111; // 1 degree latitude ≈ 111km
const RADAR_SEARCH_RADIUS_KM = 2;
const API_RESULTS_LIMIT = 100;

// Function to get container styles based on mobile state
const getContainerStyle = (isMobile) => ({
  height: isMobile ? "calc(100vh - 55px)" : "300px",
  width: isMobile ? "100%" : "500px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "lightGray",
  fontFamily: "DotMatrix",
  color: "black",
});

const RadarMap = ({ stopLocation, dataSource = [], language = "de", isMobile = false }) => {
  const [vehicles, setVehicles] = useState(null);
  const [center, setCenter] = useState([52.52, 13.405]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (stopLocation?.latitude && stopLocation?.longitude) {
      const newCenter = [stopLocation.latitude, stopLocation.longitude];
      setCenter(newCenter);
      if (mapRef.current) {
        mapRef.current.setView(newCenter);
      }
    }
  }, [stopLocation]);

  useEffect(() => {
    if (!stopLocation?.latitude || !stopLocation?.longitude) return;

    const fetchData = async () => {
      try {
        const { latitude, longitude } = stopLocation;
        const deltaLat = KM_TO_DEGREES_LAT;
        const deltaLon =
          RADAR_SEARCH_RADIUS_KM / (111 * Math.cos((latitude * Math.PI) / 180));
        const north = latitude + deltaLat;
        const south = latitude - deltaLat;
        const west = longitude - deltaLon;
        const east = longitude + deltaLon;

        const url = `https://v6.bvg.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&results=${API_RESULTS_LIMIT}`;
        const res = await fetch(url);
        const data = await res.json();
        // Get line names for the clicked station from dataSource
        const stationLineNames = dataSource
          .filter((d) => d.stopLocation?.id === stopLocation.id)
          .map((d) => d.lineName);

        const matches = data.movements?.filter((m) =>
          stationLineNames.includes(m.line?.name)
        );
        setVehicles(matches || []);
      } catch (err) {
        console.error(err);
        setVehicles([]);
      }
    };

    fetchData();
  }, [stopLocation, dataSource]);

  const vehicleIcons = {
    suburban: "🚆",
    subway: "🚇",
    tram: "🚊",
    bus: "🚌",
    ferry: "⛴️",
    express: "🚄",
    regional: "🚂",
    default: "🚍",
  };

  const containerStyle = getContainerStyle(isMobile);

  if (!stopLocation)
    return <div>{getTranslation(language, "noPositionAvailable")}</div>;
  if (vehicles === null) {
    return (
      <div style={{ ...containerStyle, flexDirection: "column" }}>
        <span style={{ marginBottom: 8 }}>
          {getTranslation(language, "loadingVehicleData")}
        </span>
        <Spin />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div style={containerStyle}>
        {getTranslation(language, "noVehicleFound")}
      </div>
    );
  }

  const markers = vehicles.map((v, idx) => {
    const icon = L.divIcon({
      html: `<div style="font-size:26px">${
        vehicleIcons[v.line?.product] || vehicleIcons.default
      }</div>`,
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    return (
      <Marker
        key={idx}
        position={[v.location.latitude, v.location.longitude]}
        icon={icon}
      >
        <Tooltip
          permanent
          direction="right"
          offset={[10, 0]}
          className="vehicle-tooltip"
        >
          {`${v.line.name} (${v.direction})`}
        </Tooltip>
      </Marker>
    );
  });

  return (
    <div style={{
      height: isMobile ? "calc(100vh - 55px)" : "300px",
      width: isMobile ? "100%" : "500px"
    }}>
      <style>{`.vehicle-tooltip{background:black !important;color:#FFA500 !important;border:none !important;}`}</style>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers}
      </MapContainer>
    </div>
  );
};

export default RadarMap;
