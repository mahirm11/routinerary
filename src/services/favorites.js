const { db } = require('./db');

function saveFavorite(phone, label, stopId, stopName, lat, lon) {
  db.prepare(
    'INSERT OR REPLACE INTO favorites (phone, label, stop_id, stop_name, lat, lon) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(phone, label, stopId, stopName, lat, lon);
}

function getFavorite(phone, label) {
  return db.prepare(
    'SELECT stop_id, stop_name, lat, lon FROM favorites WHERE phone = ? AND label = ?'
  ).get(phone, label);
}

function setPaused(phone, paused) {
  db.prepare(
    'INSERT INTO users (phone, paused) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET paused = ?'
  ).run(phone, paused ? 1 : 0, paused ? 1 : 0);
}

function isPaused(phone) {
  const row = db.prepare('SELECT paused FROM users WHERE phone = ?').get(phone);
  return row ? row.paused === 1 : false;
}

module.exports = { saveFavorite, getFavorite, setPaused, isPaused };