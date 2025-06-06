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

const RadarMap = ({ tripId }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    const { north, south, west, east } = berlinBounds;
    const url = `https://v6.bvg.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&results=200&duration=120`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const match = data.movements?.find((m) => m.tripId === tripId);
        if (match) {
          setPosition([match.location.latitude, match.location.longitude]);
        } else {
          setPosition(undefined);
        }
      })
      .catch(console.error);
  }, [tripId]);

  if (!tripId) return <div>No position available.</div>;
  if (position === undefined)
    return <div style={{ height: '300px', width: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>No vehicle found.</div>;

  return (
    <div style={{ height: '300px', width: '400px' }}>
      <MapContainer
        center={position || [52.52, 13.405]}
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
