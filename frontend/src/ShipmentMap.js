import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Popup, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Use explicit backend base URL (can be overridden with REACT_APP_API_BASE)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// Helper to safely parse JSON and detect HTML responses
const safeJson = async (response, defaultValue = null) => {
  if (response.status === 404) return defaultValue;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Network response was not ok');
  }
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await response.text();
    throw new Error('Expected JSON but got: ' + text.slice(0, 200));
  }
  return response.json();
};

// AnimatedMarker updates its position without re-rendering the whole map.
const AnimatedMarker = ({ position, children }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (
      markerRef.current &&
      Array.isArray(position) &&
      position.length === 2 &&
      position.every((coord) => Number.isFinite(coord))
    ) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return <Marker ref={markerRef} position={position}>{children}</Marker>;
};

// MapView renders the map container once.
const MapView = React.memo(({ initialPosition, markerPosition, children }) => (
  <MapContainer
    center={initialPosition}
    zoom={6}
    style={{ height: '100%', width: '100%', border: '2px solid red' }}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <AnimatedMarker position={markerPosition}>
      {children}
    </AnimatedMarker>
  </MapContainer>
));

const ShipmentMap = ({ shipmentId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [simRoute, setSimRoute] = useState([]);   // array of [lat,lng]
  const [optRoute, setOptRoute] = useState([]);   // array of [lat,lng]

  useEffect(() => {
    if (!shipmentId) return;

    let intervalId;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/containers/${shipmentId}/tracking`);
        const data = await safeJson(res, null);
        setTrackingData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchSimRoute = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/routes/simulated/${shipmentId}`);
        const json = await safeJson(res, { geometry: [] });
        const geometry = json && json.geometry ? json.geometry : [];
        // support geometry as [{lat,lng}, ...]
        setSimRoute(geometry.map(p => Array.isArray(p) ? [p[1], p[0]] : [p.lat, p.lng]));
      } catch (e) {
        setSimRoute([]);
      }
    };

    const fetchOptRoute = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/routes/optimized/${shipmentId}`);
        const json = await safeJson(res, { geometry: [] });
        const geometry = json && json.geometry ? json.geometry : [];
        // support both [[lon,lat], ...] and [{lat,lng}, ...]
        if (geometry.length > 0) {
          if (Array.isArray(geometry[0])) {
            setOptRoute(geometry.map(([lon, lat]) => [lat, lon]));
          } else if (typeof geometry[0].lat === 'number') {
            setOptRoute(geometry.map(p => [p.lat, p.lng]));
          } else {
            setOptRoute([]);
          }
        } else {
          setOptRoute([]);
        }
      } catch (e) {
        setOptRoute([]);
      }
    };

    // initial fetches
    fetchData();
    fetchSimRoute();
    fetchOptRoute();

    // Fetch new coordinates every 3 seconds (was 300ms)
    intervalId = setInterval(() => {
      fetchData();
      fetchSimRoute();
      fetchOptRoute();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [shipmentId]);

  if (loading) return <p>Loading tracking data...</p>;
  if (error) return <p>Error fetching data: {error}</p>;
  if (!trackingData) return <p>No tracking data available.</p>;
 
  // Support multiple possible field names returned by backend
  const CurrentLatitude = (function() {
    if (typeof trackingData.CurrentLatitude === 'number') return trackingData.CurrentLatitude;
    if (typeof trackingData.CurrentLat === 'number') return trackingData.CurrentLat;
    if (typeof trackingData.latitude === 'number') return trackingData.latitude;
    if (typeof trackingData.Latitude === 'number') return trackingData.Latitude;
    // try string numeric
    if (typeof trackingData.CurrentLatitude === 'string' && trackingData.CurrentLatitude) return parseFloat(trackingData.CurrentLatitude);
    return NaN;
  })();

  const CurrentLongitude = (function() {
    if (typeof trackingData.CurrentLongitude === 'number') return trackingData.CurrentLongitude;
    if (typeof trackingData.CurrentLng === 'number') return trackingData.CurrentLng;
    if (typeof trackingData.longitude === 'number') return trackingData.longitude;
    if (typeof trackingData.Longitude === 'number') return trackingData.Longitude;
    if (typeof trackingData.CurrentLongitude === 'string' && trackingData.CurrentLongitude) return parseFloat(trackingData.CurrentLongitude);
    return NaN;
  })();

  const currentStatus = trackingData.currentStatus || trackingData.current_state || trackingData.status || null;
  const estimatedDelivery = trackingData.estimatedDelivery || trackingData.estimated_delivery || null;

  if (
    typeof CurrentLatitude !== 'number' ||
    typeof CurrentLongitude !== 'number' ||
    !Number.isFinite(CurrentLatitude) ||
    !Number.isFinite(CurrentLongitude)
  ) {
    return <p>Invalid location data received from backend.</p>;
  }

  const markerPosition = [CurrentLatitude, CurrentLongitude];

  return (
    <MapView initialPosition={markerPosition} markerPosition={markerPosition}>
      <Popup>
        Shipment is here.
        <br />
        Status: {currentStatus}
        <br />
        Estimated Delivery: {estimatedDelivery ? new Date(estimatedDelivery).toLocaleString() : 'N/A'}
      </Popup>

      {/* {simRoute.length > 0 && (
        <Polyline
          positions={simRoute}
          pathOptions={{ color: 'blue', weight: 3 }}
        />
      )} */}

      {optRoute.length > 0 && (
        <Polyline
          positions={optRoute}
          pathOptions={{ color: 'red', dashArray: '8 4', weight: 3 }}
        />
      )}
    </MapView>
  );
};

export default ShipmentMap;