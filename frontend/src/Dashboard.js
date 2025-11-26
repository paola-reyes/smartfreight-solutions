import React, { useEffect, useState } from 'react';
import ShipmentMap from './ShipmentMap';
import './Dashboard.css'; 
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';


const safeJson = async (response, defaultValue = {}) => {
  // Treat 404 and 304 as 'no data' and return the provided default value.
  if (response.status === 404 || response.status === 304) {
    return defaultValue;
  }
  if (!response.ok) {
    const clonedResponse = response.clone();
    const errorText = await clonedResponse.text();
    throw new Error(errorText || 'Network response was not ok');
  }
  return response.json().catch(() => defaultValue); // Fallback if JSON parsing fails
};

// Use explicit backend base URL (override with REACT_APP_API_BASE)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// Helper to avoid browser caching (prevents 304 Not Modified responses)
const fetchNoCache = (path, defaultValue = null) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
    .then(res => safeJson(res, defaultValue));
};

const Dashboard = ({ shipmentId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Group incidents by type
  const incidentData = incidents.reduce((acc, curr) => {
    const existing = acc.find(o => o.type === curr.IncidentType);
    if (existing) existing.count++;
    else acc.push({ type: curr.IncidentType, count: 1 });
    return acc;
  }, []);

  // click handler
  const handleBarClick = ({ type }) => {
    setSelectedType(type === selectedType ? null : type);
  };

  useEffect(() => {
    const fetchDashboardData = () => {
      Promise.all([
        fetchNoCache(`/api/containers/${shipmentId}/tracking`, null),
        fetchNoCache(`/api/containers/${shipmentId}/sensors`, []),
        fetchNoCache(`/api/incidents/container/${shipmentId}`, []),
        fetchNoCache(`/api/routes/optimize/${shipmentId}`, [])
      ])
        .then(([tracking, sensors, incidentList, routeHistory]) => {
          setTrackingData(tracking);
          setSensorData(sensors);
          setIncidents(incidentList);
          setRoutes(routeHistory);
          setLoading(false);
        })
        .catch(err => {
          console.error("Fetch error:", err);
          setError(err.message);
          setLoading(false);
        });
    };

    // Initial fetch
    fetchDashboardData();

    // Refresh dashboard data every 3 seconds
    const intervalId = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(intervalId);
  }, [shipmentId]);

  if (loading) return <p>Loading dashboard data...</p>;

  return (
    <div className="dashboard">
      {error && <p className="error">Error loading data: {error}</p>}

        {/* Shipment Location */}
        <section className="map-section">
          <h2>Shipment Location</h2>
          <ShipmentMap shipmentId={shipmentId} />
        </section>

        <div className="dashboard-grid">

        {/* Tracking Information */}
        <section className="dashboard-item tracking-info">
          <h2>Tracking Information</h2>
          {(trackingData && (
            trackingData.currentStatus ||
            (typeof trackingData.CurrentLatitude === 'number' && Number.isFinite(trackingData.CurrentLatitude)) ||
            (typeof trackingData.CurrentLongitude === 'number' && Number.isFinite(trackingData.CurrentLongitude)) ||
            trackingData.Timestamp
          )) ? (
            <>
              <p><strong>Status:</strong> {trackingData.currentStatus || 'N/A'}</p>
              <p>
                <strong>Estimated Delivery:</strong>{" "}
                {trackingData.estimatedDelivery ? new Date(trackingData.estimatedDelivery).toLocaleString() : "N/A"}
              </p>
            </>
          ) : (
            <p>No tracking data available.</p>
          )}
        </section>

        {/* Sensor Readings */}
        <section className="dashboard-item sensor-readings">
          <h2>Recent Sensor Readings</h2>
          {sensorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={sensorData.map(r => ({
                  time: new Date(r.Timestamp).toLocaleTimeString(),
                  Temperature: r.Temperature,
                  'G-Force': r.GForce
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="Temperature" stroke="#66fcf1" />
                <Line type="monotone" dataKey="G-Force" stroke="#ff6b6b" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No sensor data available.</p>
          )}
        </section>


        <section className="dashboard-item incidents">
        <h2>Incidents</h2>
        {incidentData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={incidentData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#ff6b6b"
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>

            {selectedType && (
              <div className="incident-details">
                <h3>{selectedType} Incident{incidentData.find(d=>d.type===selectedType).count>1?'s':''}</h3>
                {incidents
                  .filter(i => i.IncidentType === selectedType)
                  .map((inc, i) => (
                    <div key={i} className="incident-entry">
                      <p><strong>Severity:</strong> {inc.Severity}</p>
                      <p><strong>Description:</strong> {inc.Description}</p>
                      <p><strong>Time:</strong> {new Date(inc.Timestamp).toLocaleString()}</p>
                    </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p>No incidents reported.</p>
        )}
      </section>


        {/* Route Optimization*/}
        <section className="dashboard-item route-optimization">
          <h2>Route Optimization</h2>
          {routes.length > 0 ? (
            routes.map((route, index) => (
              <div key={index} className="route-entry">
                <p><strong>Time:</strong> {route.Timestamp}</p>
                <p><strong>Route:</strong> {route.OptimizedRoute}</p>
                <p><strong>Traffic:</strong> {route.TrafficConditions}</p>
                <p><strong>Weather:</strong> {route.WeatherConditions}</p>
              </div>
            ))
          ) : (
            <p>No route optimization available.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
