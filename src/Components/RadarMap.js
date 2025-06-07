import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import { Spin } from 'antd';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getTranslation } from '../dictionary';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RadarMap = ({ stopLocation, lines = [], language = 'de' }) => {
  const [vehicles, setVehicles] = useState(null);
  const [center, setCenter] = useState([52.52, 13.405]);
  const mapRef = useRef(null);
  const hasCentered = useRef(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (stopLocation?.latitude && stopLocation?.longitude) {
      const newCenter = [stopLocation.latitude, stopLocation.longitude];
      setCenter(newCenter);
      if (mapRef.current) {
        mapRef.current.setView(newCenter);
      }
      hasCentered.current = false;
    }
  }, [stopLocation]);

  useEffect(() => {
    if (!stopLocation) return;
    const fetchData = async () => {
      try {
        const { latitude, longitude } = stopLocation;
        if (latitude && longitude) {
          if (initialLoad) setCenter([latitude, longitude]);
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
      } finally {
        setInitialLoad(false);
      }
    };
    if (initialLoad) setVehicles(null);
    fetchData();
  }, [stopLocation, lines]);

  const vehicleIcons = {
    suburban: '🚆',
    subway: '🚇',
    tram: '🚊',
    bus: '🚌',
    ferry: '⛴️',
    express: '🚄',
    regional: '🚂',
    default: '🚍',
  };

  if (!stopLocation) return <div>{getTranslation(language, 'noPositionAvailable')}</div>;
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
          backgroundColor: 'lightGray',
          fontFamily: 'DotMatrix',
          color: 'black',
        }}
      >
        <span style={{ marginBottom: 8 }}>{getTranslation(language, 'loadingVehicleData')}</span>
        <Spin />
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
          backgroundColor: 'lightGray',
          fontFamily: 'DotMatrix',
          color: 'black',
        }}
      >
        {getTranslation(language, 'noVehicleFound')}
      </div>
    );

  const markers = (vehicles || []).map((v, idx) => {
    const icon = L.divIcon({
      html: `<div style="font-size:26px">${
        vehicleIcons[v.line?.product] || vehicleIcons.default
      }</div>`,
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
        zoom={15}
        style={{ height: '100%', width: '100%' }}
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
