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

function getAllHomeFavorites() {
  return db.prepare(`
    SELECT f.phone, f.stop_id, f.stop_name, f.lat, f.lon
    FROM favorites f
    LEFT JOIN users u ON u.phone = f.phone
    WHERE f.label = 'home' AND (u.paused IS NULL OR u.paused = 0)
  `).all();
}

function getHomeFavoritesForTime(time) {
  return db.prepare(`
    SELECT f.phone, f.stop_id, f.stop_name, f.lat, f.lon
    FROM favorites f
    LEFT JOIN users u ON u.phone = f.phone
    WHERE f.label = 'home'
      AND (u.paused IS NULL OR u.paused = 0)
      AND COALESCE(u.notify_time, '07:00') = ?
  `).all(time);
}

function setNotifyTime(phone, time) {
  db.prepare(
    'INSERT INTO users (phone, notify_time) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET notify_time = ?'
  ).run(phone, time, time);
}

module.exports = {
  saveFavorite,
  getFavorite,
  setPaused,
  isPaused,
  getAllHomeFavorites,
  getHomeFavoritesForTime,
  setNotifyTime,
};