// ============================================================
// TransitOps business rules engine (plain SQL).
// Every status transition runs inside db.transaction() —
// vehicle, driver and trip can never desync.
// Maps 1:1 to Section 4 "Mandatory Business Rules".
// ============================================================
import { db, uid, nowIso } from "./db.js";

export const VEHICLE_TYPES = ["Van", "Truck", "Mini Truck", "Trailer"];
const today = () => new Date().toISOString();

// ---------- eligibility pools ----------
export function dispatchableVehicles() {
  // Rule 2: Retired / In Shop / On Trip vehicles never appear in dispatch selection
  return db.prepare(`SELECT * FROM vehicles WHERE status='Available' ORDER BY name`).all();
}
export function eligibleDrivers() {
  // Rule 3: expired licenses or non-Available statuses are excluded
  return db.prepare(`SELECT * FROM drivers WHERE status='Available' AND licenseExpiry > ? ORDER BY name`).all(today());
}

// ---------- trip lifecycle ----------
export function createTrip({ source, destination, vehicleId, driverId, cargoWeightKg, plannedKm }) {
  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(vehicleId);
  const driver = db.prepare(`SELECT * FROM drivers WHERE id=?`).get(driverId);
  if (!vehicle) throw new Error("Vehicle not found");
  if (!driver) throw new Error("Driver not found");
  if (vehicle.status !== "Available")
    throw new Error(`${vehicle.name} is ${vehicle.status} — not available for dispatch`); // Rules 2 & 4
  if (driver.status !== "Available")
    throw new Error(`${driver.name} is ${driver.status} — cannot be assigned`); // Rules 3 & 4
  if (driver.licenseExpiry <= today())
    throw new Error(`${driver.name}'s license expired on ${driver.licenseExpiry.slice(0, 10)} — cannot be assigned`); // Rule 3
  const cargo = Number(cargoWeightKg);
  if (!(cargo > 0)) throw new Error("Cargo weight must be a positive number");
  if (cargo > vehicle.maxLoadKg)
    throw new Error(`Cargo ${cargo} kg exceeds ${vehicle.name}'s capacity of ${vehicle.maxLoadKg} kg`); // Rule 5

  const id = uid();
  db.prepare(`INSERT INTO trips (id, source, destination, cargoWeightKg, plannedKm, vehicleId, driverId)
              VALUES (?,?,?,?,?,?,?)`)
    .run(id, source, destination, cargo, Number(plannedKm), vehicleId, driverId);
  return id;
}

export const dispatchTrip = db.transaction((tripId) => {
  const trip = db.prepare(`SELECT * FROM trips WHERE id=?`).get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Draft") throw new Error(`Only Draft trips can be dispatched (this one is ${trip.status})`);

  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(trip.vehicleId);
  const driver = db.prepare(`SELECT * FROM drivers WHERE id=?`).get(trip.driverId);
  if (vehicle.status !== "Available") throw new Error(`${vehicle.name} is ${vehicle.status} — dispatch blocked`); // Rules 2 & 4
  if (driver.status !== "Available") throw new Error(`${driver.name} is ${driver.status} — dispatch blocked`);    // Rules 3 & 4
  if (driver.licenseExpiry <= today()) throw new Error(`${driver.name}'s license has expired — dispatch blocked`); // Rule 3
  if (trip.cargoWeightKg > vehicle.maxLoadKg) throw new Error(`Cargo exceeds capacity — dispatch blocked`);        // Rule 5

  // Rule 6: dispatch flips BOTH to On Trip — one transaction
  db.prepare(`UPDATE vehicles SET status='On Trip' WHERE id=?`).run(vehicle.id);
  db.prepare(`UPDATE drivers SET status='On Trip' WHERE id=?`).run(driver.id);
  db.prepare(`UPDATE trips SET status='Dispatched', dispatchedAt=?, startOdometerKm=? WHERE id=?`)
    .run(nowIso(), vehicle.odometerKm, tripId);
});

export const completeTrip = db.transaction((tripId, { endOdometerKm, fuelLiters, fuelCost, revenue }) => {
  const trip = db.prepare(`SELECT * FROM trips WHERE id=?`).get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Dispatched") throw new Error("Only Dispatched trips can be completed");
  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(trip.vehicleId);

  const endOdo = Number(endOdometerKm);
  if (!(endOdo >= vehicle.odometerKm))
    throw new Error(`End odometer (${endOdo}) can't be less than current (${vehicle.odometerKm})`);

  const liters = Number(fuelLiters || 0);
  if (liters > 0)
    db.prepare(`INSERT INTO fuel_logs (id, vehicleId, liters, cost, date) VALUES (?,?,?,?,?)`)
      .run(uid(), trip.vehicleId, liters, Number(fuelCost || 0), nowIso());

  // Rule 7: completion restores BOTH to Available
  db.prepare(`UPDATE vehicles SET status='Available', odometerKm=? WHERE id=?`).run(endOdo, trip.vehicleId);
  db.prepare(`UPDATE drivers SET status='Available' WHERE id=?`).run(trip.driverId);
  db.prepare(`UPDATE trips SET status='Completed', completedAt=?, endOdometerKm=?, revenue=? WHERE id=?`)
    .run(nowIso(), endOdo, Number(revenue || 0), tripId);
});

export const cancelTrip = db.transaction((tripId) => {
  const trip = db.prepare(`SELECT * FROM trips WHERE id=?`).get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (!["Draft", "Dispatched"].includes(trip.status)) throw new Error(`${trip.status} trips cannot be cancelled`);
  // Rule 8: cancelling a dispatched trip restores vehicle & driver
  if (trip.status === "Dispatched") {
    db.prepare(`UPDATE vehicles SET status='Available' WHERE id=?`).run(trip.vehicleId);
    db.prepare(`UPDATE drivers SET status='Available' WHERE id=?`).run(trip.driverId);
  }
  db.prepare(`UPDATE trips SET status='Cancelled' WHERE id=?`).run(tripId);
});

// ---------- maintenance lifecycle ----------
export const openMaintenance = db.transaction((vehicleId, { description, cost }) => {
  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(vehicleId);
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "On Trip") throw new Error(`${vehicle.name} is On Trip — complete or cancel the trip first`);
  if (vehicle.status === "Retired") throw new Error(`${vehicle.name} is Retired`);
  // Rule 9: opening maintenance flips vehicle to In Shop (removed from dispatch pool)
  db.prepare(`UPDATE vehicles SET status='In Shop' WHERE id=?`).run(vehicleId);
  db.prepare(`INSERT INTO maintenance_logs (id, vehicleId, description, cost) VALUES (?,?,?,?)`)
    .run(uid(), vehicleId, description, Number(cost || 0));
});

export const closeMaintenance = db.transaction((logId) => {
  const log = db.prepare(`SELECT * FROM maintenance_logs WHERE id=?`).get(logId);
  if (!log) throw new Error("Maintenance log not found");
  if (log.status !== "Open") throw new Error("This maintenance record is already closed");
  const vehicle = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(log.vehicleId);
  db.prepare(`UPDATE maintenance_logs SET status='Closed', closedAt=? WHERE id=?`).run(nowIso(), logId);
  // Rule 10: closing restores the vehicle to Available (unless Retired, or other maintenance still open)
  if (vehicle.status !== "Retired") {
    const stillOpen = db.prepare(`SELECT COUNT(*) c FROM maintenance_logs WHERE vehicleId=? AND status='Open'`).get(log.vehicleId).c;
    if (stillOpen === 0) db.prepare(`UPDATE vehicles SET status='Available' WHERE id=?`).run(log.vehicleId);
  }
});
