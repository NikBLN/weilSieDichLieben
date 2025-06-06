import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { Progress } from 'antd';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
};

const RadarMap = ({ stopLocation, lines = [] }) => {
  const [vehicles, setVehicles] = useState(null);
  const [center, setCenter] = useState([52.52, 13.405]);

  useEffect(() => {
    if (!stopLocation) return;
    setVehicles(null);
    const fetchData = async () => {
      try {
        const { latitude, longitude } = stopLocation;
        if (latitude && longitude) {
          setCenter([latitude, longitude]);
          const deltaLat = 2 / 111;
          const deltaLon = 2 / (111 * Math.cos((latitude * Math.PI) / 180));
          const north = latitude + deltaLat;
          const south = latitude - deltaLat;
          const west = longitude - deltaLon;
          const east = longitude + deltaLon;
          const url = `https://v6.bvg.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&results=500&duration=300`;
          const res = await fetch(url);
          const data = await res.json();
          const matches = data.movements?.filter((m) => lines.includes(m.line?.name));
          setVehicles(matches || []);
        }
      } catch (err) {
        console.error(err);
        setVehicles([]);
      }
    };
    fetchData();
  }, [stopLocation, lines]);

  const vehicleIcons = {
    bus: '🚌',
    tram: '🚊',
    subway: '🚇',
    ferry: '⛴️',
    train: '🚆',
    default: '🚍',
  };

  if (!stopLocation) return <div>No position available.</div>;
  if (vehicles === null)
    return (
      <div
        style={{
          height: '300px',
          width: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'white', marginBottom: 8 }}>
          Loading Vehicle Positions...
        </div>
        <Progress percent={99} status="active" showInfo={false} style={{ width: '80%' }} />
      </div>
    );
  if (vehicles && vehicles.length === 0)
    return (
      <div
        style={{
          height: '300px',
          width: '500px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        No vehicle found.
      </div>
    );

  const markers = (vehicles || []).map((v, idx) => {
    const icon = L.divIcon({
      html: vehicleIcons[v.line?.mode] || vehicleIcons.default,
      className: '',
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
    <div style={{ height: '300px', width: '500px' }}>
      <style>{`.vehicle-tooltip{background:black !important;color:#FFA500 !important;border:none !important;}`}</style>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers}
        <RecenterMap center={center} />
      </MapContainer>
    </div>
  );
};

export default RadarMap;
