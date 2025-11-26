// AnalogClock.js
import React, { useState, useEffect } from 'react';

/**
 * A single analog clock that also displays digital time underneath.
 * Props:
 *   - city: string (e.g. "New York")
 *   - timeZone: string (e.g. "America/New_York")
 */
const AnalogClock = ({ city, timeZone }) => {
  // We store a "local" date/time for the given time zone
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      // Convert current time to the specified time zone
      const localTimeString = new Date().toLocaleString('en-US', { timeZone });
      setDate(new Date(localTimeString));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeZone]);

  // Extract hours, minutes, seconds
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Calculate angles for hour, minute, second hands
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30 degrees per hour + 0.5 per minute
  const minuteAngle = minutes * 6 + seconds * 0.1;    // 6 degrees per minute + 0.1 per second
  const secondAngle = seconds * 6;                   // 6 degrees per second

  // Also generate a digital time string
  const digitalTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
    timeZone,
  });

  return (
    <div className="analog-clock">
      <div className="city-label">{city}</div>
      <svg className="clock-face" viewBox="0 0 100 100">
        {/* Outer clock circle */}
        <circle cx="50" cy="50" r="48" fill="#fff" stroke="#000" strokeWidth="2" />
        
        {/* Hour hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="28"
          stroke="#000"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 50 50)`}
        />
        
        {/* Minute hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
        />
        
        {/* Second hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="16"
          stroke="#f00"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondAngle} 50 50)`}
        />
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="#000" />
      </svg>
      <div className="digital-time">{digitalTime}</div>
    </div>
  );
};

export default AnalogClock;
