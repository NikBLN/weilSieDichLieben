import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const berlinBounds = {
  north: 53.0,
  south: 52.0,
  west: 12.8,
  east: 14.0,
};

const RadarMap = ({ tripId, stopId }) => {
  const [position, setPosition] = useState(null);
  const [center, setCenter] = useState([52.52, 13.405]);

  useEffect(() => {
    if (!tripId || !stopId) return;
    const fetchData = async () => {
      try {
        const stopRes = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}`);
        const stopData = await stopRes.json();
        const { latitude, longitude } = stopData.location || {};
        if (latitude && longitude) {
          setCenter([latitude, longitude]);
          const delta = 0.1;
          const north = latitude + delta;
          const south = latitude - delta;
          const west = longitude - delta;
          const east = longitude + delta;
          const url = `https://v6.bvg.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&results=500&duration=300`;
          const res = await fetch(url);
          const data = await res.json();
          const match = data.movements?.find((m) => m.tripId === tripId);
          if (match) {
            setPosition([match.location.latitude, match.location.longitude]);
          } else {
            setPosition(undefined);
          }
        }
      } catch (err) {
        console.error(err);
        setPosition(undefined);
      }
    };
    fetchData();
  }, [tripId, stopId]);

  if (!tripId) return <div>No position available.</div>;
  if (position === undefined)
    return <div style={{ height: '300px', width: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>No vehicle found.</div>;

  return (
    <div style={{ height: '300px', width: '400px' }}>
      <MapContainer
        center={position || center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
};

export default RadarMap;
