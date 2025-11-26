const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database.db');
console.log('Opening DB at', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

const query = `SELECT ReadingID, SensorID, Timestamp, Latitude, Longitude, GForce, Temperature, ContainerID FROM SensorReading ORDER BY Timestamp DESC LIMIT 50`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Query error:', err.message);
    db.close();
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
