// App.js
import React, { useState } from 'react';
import Dashboard from './Dashboard';
import WorldClocks from './WorldClocks';
import './App.css';
import './Dashboard.css';

function App() {
  const [shipmentId, setShipmentId] = useState('');
  const [submittedShipmentId, setSubmittedShipmentId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedShipmentId(shipmentId);
  };

  return (
    <div className="App">
      {/* World Clocks at the top */}
      <WorldClocks />

      <header className="App-header">
        <h1>SmartFreight Shipment Tracking</h1>
        <form className="track-shipment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Shipment Code"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          />
          <button className="track-shipment-form button" type="submit">
            Track Shipment
          </button>
        </form>
      </header>

      {submittedShipmentId && (
        <div className="dashboard-container">
          <Dashboard shipmentId={submittedShipmentId} />
        </div>
      )}

      {/* Inline SVG Background */}
      <svg
        className="background-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 560"
        preserveAspectRatio="none"
      >
        <path
          fill="#f0f0f0"
          d="M0,320L48,293.3C96,267,192,213,288,192C384,171,480,181,576,181.3C672,181,768,171,864,165.3C960,160,1056,160,1152,149.3C1248,139,1344,117,1392,106.7L1440,96L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z"
        />
      </svg>
    </div>
  );
}

export default App;
