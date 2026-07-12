// File-based JSON database (lowdb) — zero external setup, so this module
// can run standalone for a demo/hackathon. Swap out models/Vehicle.js for
// Postgres/Mongo later without touching controllers or routes.

const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbFile = path.join(__dirname, '..', 'data', 'db.json');
const adapter = new FileSync(dbFile);
const db = low(adapter);

db.defaults({
  vehicles: []
}).write();

module.exports = db;
