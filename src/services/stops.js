const fs = require('fs');

let stops = [];

function loadStops(stopsTxtPath) {
  const lines = fs.readFileSync(stopsTxtPath, 'utf8').split('\n').slice(1);
  stops = lines
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(',');
      // columns: stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, ...
      const [stop_id, , stop_name, , stop_lat, stop_lon] = cols;
      return { stop_id, stop_name, lat: parseFloat(stop_lat), lon: parseFloat(stop_lon) };
    })
    .filter((s) => !isNaN(s.lat) && !isNaN(s.lon));
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestStop(lat, lon) {
  if (!stops.length) throw new Error('Call loadStops() at startup first');
  return stops
    .map((s) => ({ ...s, dist: distance(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.dist - b.dist)[0];
}

module.exports = { loadStops, nearestStop };