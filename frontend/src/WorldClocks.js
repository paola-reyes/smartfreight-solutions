// WorldClocks.js
import React from 'react';
import AnalogClock from './AnalogClock';

const cities = [
  { city: 'New York', timeZone: 'America/New_York' },
  { city: 'London', timeZone: 'Europe/London' },
  { city: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { city: 'Sydney', timeZone: 'Australia/Sydney' },
];

/**
 * Renders a row of analog clocks for different time zones
 */
const WorldClocks = () => {
  return (
    <div className="world-clocks">
      {cities.map(({ city, timeZone }) => (
        <AnalogClock key={city} city={city} timeZone={timeZone} />
      ))}
    </div>
  );
};

export default WorldClocks;
