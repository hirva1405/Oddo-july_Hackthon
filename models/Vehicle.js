const { randomUUID } = require('crypto');
const db = require('../config/db');

// Status values exactly as defined in spec 3.3
const STATUS = Object.freeze({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired'
});

const VALID_STATUSES = Object.values(STATUS);

// Statuses that must NEVER appear in the dispatch selection pool
// (spec 4: "Retired or In Shop vehicles must never appear in the dispatch selection.")
const DISPATCH_EXCLUDED_STATUSES = [STATUS.IN_SHOP, STATUS.RETIRED];

function all() {
  return db.get('vehicles').value();
}

function findById(id) {
  return db.get('vehicles').find({ id }).value();
}

function findByRegistrationNumber(registrationNumber) {
  return db
    .get('vehicles')
    .find((v) => v.registrationNumber.toLowerCase() === registrationNumber.toLowerCase())
    .value();
}

function create(data) {
  const vehicle = {
    id: randomUUID(),
    registrationNumber: data.registrationNumber.trim().toUpperCase(),
    name: data.name.trim(),
    type: data.type.trim(),
    maxLoadCapacity: Number(data.maxLoadCapacity),
    odometer: data.odometer !== undefined ? Number(data.odometer) : 0,
    acquisitionCost: Number(data.acquisitionCost),
    status: data.status || STATUS.AVAILABLE,
    region: data.region ? data.region.trim() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.get('vehicles').push(vehicle).write();
  return vehicle;
}

function update(id, changes) {
  const vehicle = findById(id);
  if (!vehicle) return null;

  const updated = {
    ...vehicle,
    ...changes,
    id: vehicle.id, // never allow id to be overwritten
    updatedAt: new Date().toISOString()
  };

  db.get('vehicles').find({ id }).assign(updated).write();
  return updated;
}

function remove(id) {
  const vehicle = findById(id);
  if (!vehicle) return null;
  db.get('vehicles').remove({ id }).write();
  return vehicle;
}

// Vehicles eligible for dispatch selection (spec 4 business rule)
function availableForDispatch() {
  return db
    .get('vehicles')
    .filter((v) => !DISPATCH_EXCLUDED_STATUSES.includes(v.status))
    .value();
}

module.exports = {
  STATUS,
  VALID_STATUSES,
  DISPATCH_EXCLUDED_STATUSES,
  all,
  findById,
  findByRegistrationNumber,
  create,
  update,
  remove,
  availableForDispatch
};
