// Lightweight file-based database (JSON) using lowdb.
// This keeps the auth module dependency-free from any external DB server,
// so it can be run instantly for a hackathon demo. Swap this out for
// Postgres/Mongo later by re-implementing models/User.js with the same
// exported function signatures.

const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const dbFile = path.join(__dirname, '..', 'data', 'db.json');
const adapter = new FileSync(dbFile);
const db = low(adapter);

// Seed default structure + one sample user per role (password: Passw0rd!)
db.defaults({
  users: []
}).write();

module.exports = db;
