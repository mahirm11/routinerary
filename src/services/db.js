const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_URL || './routinerary.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    phone TEXT NOT NULL,
    label TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    stop_name TEXT NOT NULL,
    lat REAL,
    lon REAL,
    PRIMARY KEY (phone, label)
  )
`);

module.exports = { db };