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

module.exports = { saveFavorite, getFavorite };