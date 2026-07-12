// TransitOps data layer — plain SQL via better-sqlite3.
// Synchronous, transactional, zero config: the DB file is created on first run.
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "transitops.db");

function init() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'DRIVER',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    registrationNumber TEXT NOT NULL UNIQUE,   -- Rule 1: unique registration
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'Gujarat',
    maxLoadKg REAL NOT NULL,
    odometerKm REAL NOT NULL DEFAULT 0,
    acquisitionCost REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',  -- Available | On Trip | In Shop | Retired
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    licenseNumber TEXT NOT NULL UNIQUE,
    licenseCategory TEXT NOT NULL,
    licenseExpiry TEXT NOT NULL,               -- ISO date
    contactNumber TEXT NOT NULL,
    safetyScore INTEGER NOT NULL DEFAULT 80,
    status TEXT NOT NULL DEFAULT 'Available',  -- Available | On Trip | Off Duty | Suspended
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    cargoWeightKg REAL NOT NULL,
    plannedKm REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',      -- Draft | Dispatched | Completed | Cancelled
    revenue REAL NOT NULL DEFAULT 0,
    startOdometerKm REAL,
    endOdometerKm REAL,
    dispatchedAt TEXT,
    completedAt TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    vehicleId TEXT NOT NULL REFERENCES vehicles(id),
    driverId TEXT NOT NULL REFERENCES drivers(id)
  );
  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Open',       -- Open | Closed
    openedAt TEXT NOT NULL DEFAULT (datetime('now')),
    closedAt TEXT,
    vehicleId TEXT NOT NULL REFERENCES vehicles(id)
  );
  CREATE TABLE IF NOT EXISTS fuel_logs (
    id TEXT PRIMARY KEY,
    liters REAL NOT NULL,
    cost REAL NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    vehicleId TEXT NOT NULL REFERENCES vehicles(id)
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    vehicleId TEXT REFERENCES vehicles(id)
  );
  CREATE TABLE IF NOT EXISTS vehicle_documents (
    id TEXT PRIMARY KEY,
    vehicleId TEXT NOT NULL REFERENCES vehicles(id),
    docType TEXT NOT NULL,          -- RC Book | Insurance | Permit | PUC | Other
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    expiryDate TEXT,
    uploadedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
  CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
  `);
  return db;
}

const g = globalThis;
export const db = g.__transitops_db || (g.__transitops_db = init());
export const uid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
