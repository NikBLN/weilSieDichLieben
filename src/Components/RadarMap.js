import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const berlinBounds = {
  north: 52.7,
  south: 52.3,
  west: 13.0,
  east: 13.8,
};

const RadarMap = ({ tripId }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    const { north, south, west, east } = berlinBounds;
    const url = `https://v6.bvg.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&results=200`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const match = data.movements?.find((m) => m.tripId === tripId);
        if (match) {
          setPosition([match.location.latitude, match.location.longitude]);
        }
      })
      .catch(console.error);
  }, [tripId]);

  if (!tripId) return <div>No position available.</div>;

  return (
    <div style={{ height: '200px', width: '300px' }}>
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
