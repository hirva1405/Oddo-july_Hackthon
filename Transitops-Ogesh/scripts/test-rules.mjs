// Verifies all 10 mandatory business rules against the seeded database.
import { db, uid } from "../lib/db.js";
import * as svc from "../lib/services.js";

let pass = 0, failCount = 0;
const t = (name, fn) => { try { fn(); console.log("  ✅", name); pass++; } catch (e) { console.log("  ❌", name, "→", e.message); failCount++; } };
const expectThrow = (fn, frag) => {
  try { fn(); throw new Error("EXPECTED-BLOCK-BUT-PASSED"); }
  catch (e) {
    if (e.message === "EXPECTED-BLOCK-BUT-PASSED") throw e;
    if (frag && !e.message.toLowerCase().includes(frag.toLowerCase()))
      throw new Error(`blocked, but wrong reason: "${e.message}"`);
  }
};
const V = (n) => db.prepare(`SELECT * FROM vehicles WHERE name=?`).get(n);
const D = (n) => db.prepare(`SELECT * FROM drivers WHERE name=?`).get(n);

console.log("RULE 1 — unique registration number");
t("duplicate registration is rejected by DB constraint", () => {
  expectThrow(() =>
    db.prepare(`INSERT INTO vehicles (id,registrationNumber,name,model,type,maxLoadKg,acquisitionCost)
                VALUES (?,?,?,?,?,?,?)`).run(uid(), "GJ-06-AB-1234", "Dup", "X", "Van", 100, 1),
    "UNIQUE");
});

console.log("RULE 2 — Retired / In Shop vehicles excluded from dispatch");
t("dispatch pool contains no Retired or In Shop vehicles", () => {
  const pool = svc.dispatchableVehicles();
  if (pool.some((v) => ["Retired", "In Shop", "On Trip"].includes(v.status))) throw new Error("pool leaked ineligible vehicle");
  if (pool.find((v) => v.name === "Van-11")) throw new Error("Van-11 (In Shop) leaked into pool");
  if (pool.find((v) => v.name === "Van-01")) throw new Error("Van-01 (Retired) leaked into pool");
});
t("creating a trip with an In Shop vehicle is blocked", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-11").id, driverId: D("Ravi Patel").id, cargoWeightKg: 100, plannedKm: 10 }), "In Shop");
});

console.log("RULE 3 — expired-license & suspended drivers blocked");
t("eligible pool excludes Alex (expired) and Deepak (suspended)", () => {
  const pool = svc.eligibleDrivers();
  if (pool.find((d) => d.name === "Alex Fernandes")) throw new Error("expired license leaked");
  if (pool.find((d) => d.name === "Deepak Rana")) throw new Error("suspended driver leaked");
});
t("assigning Alex (expired license) is blocked with the right message", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-05").id, driverId: D("Alex Fernandes").id, cargoWeightKg: 100, plannedKm: 10 }), "expired");
});
t("assigning Deepak (Suspended) is blocked", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-05").id, driverId: D("Deepak Rana").id, cargoWeightKg: 100, plannedKm: 10 }), "Suspended");
});

console.log("RULE 4 — no double-assignment of On Trip vehicle/driver");
t("Truck-02 (On Trip) cannot be given another trip", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Truck-02").id, driverId: D("Ravi Patel").id, cargoWeightKg: 100, plannedKm: 10 }), "On Trip");
});
t("Imran (On Trip) cannot be assigned again", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-05").id, driverId: D("Imran Qureshi").id, cargoWeightKg: 100, plannedKm: 10 }), "On Trip");
});

console.log("RULE 5 — cargo must not exceed capacity");
t("550 kg into Van-05 (500 kg) is blocked", () => {
  expectThrow(() => svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-05").id, driverId: D("Ravi Patel").id, cargoWeightKg: 550, plannedKm: 10 }), "exceeds");
});

console.log("RULES 6 & 7 — dispatch and completion flip statuses atomically");
let tripId;
t("valid trip (450kg ≤ 500kg) creates as Draft", () => {
  tripId = svc.createTrip({ source: "Vadodara", destination: "Surat", vehicleId: V("Van-05").id, driverId: D("Ravi Patel").id, cargoWeightKg: 450, plannedKm: 150 });
  const trip = db.prepare(`SELECT * FROM trips WHERE id=?`).get(tripId);
  if (trip.status !== "Draft") throw new Error("not Draft");
});
t("dispatch → vehicle & driver both On Trip", () => {
  svc.dispatchTrip(tripId);
  if (V("Van-05").status !== "On Trip") throw new Error("vehicle not flipped");
  if (D("Ravi Patel").status !== "On Trip") throw new Error("driver not flipped");
});
t("complete → both Available, odometer updated, fuel logged, revenue saved", () => {
  const before = db.prepare(`SELECT COUNT(*) c FROM fuel_logs`).get().c;
  svc.completeTrip(tripId, { endOdometerKm: 42330, fuelLiters: 14, fuelCost: 1430, revenue: 9500 });
  if (V("Van-05").status !== "Available") throw new Error("vehicle not restored");
  if (D("Ravi Patel").status !== "Available") throw new Error("driver not restored");
  if (V("Van-05").odometerKm !== 42330) throw new Error("odometer not updated");
  if (db.prepare(`SELECT COUNT(*) c FROM fuel_logs`).get().c !== before + 1) throw new Error("fuel not logged");
  if (db.prepare(`SELECT revenue FROM trips WHERE id=?`).get(tripId).revenue !== 9500) throw new Error("revenue missing");
});

console.log("RULE 8 — cancelling a dispatched trip restores both");
t("cancel dispatched trip → both Available again", () => {
  const id2 = svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-05").id, driverId: D("Ravi Patel").id, cargoWeightKg: 200, plannedKm: 40 });
  svc.dispatchTrip(id2);
  svc.cancelTrip(id2);
  if (V("Van-05").status !== "Available" || D("Ravi Patel").status !== "Available") throw new Error("not restored");
});

console.log("RULES 9 & 10 — maintenance flips In Shop and back");
t("open maintenance → In Shop and OUT of dispatch pool", () => {
  svc.openMaintenance(V("Van-09").id, { description: "Test brake check", cost: 900 });
  if (V("Van-09").status !== "In Shop") throw new Error("not In Shop");
  if (svc.dispatchableVehicles().find((v) => v.name === "Van-09")) throw new Error("still in pool");
});
t("close maintenance → Available again", () => {
  const log = db.prepare(`SELECT * FROM maintenance_logs WHERE vehicleId=? AND status='Open'`).get(V("Van-09").id);
  svc.closeMaintenance(log.id);
  if (V("Van-09").status !== "Available") throw new Error("not restored");
});
t("atomicity: failed dispatch leaves nothing half-flipped", () => {
  const id3 = svc.createTrip({ source: "A", destination: "B", vehicleId: V("Van-09").id, driverId: D("Priya Nair").id, cargoWeightKg: 100, plannedKm: 10 });
  db.prepare(`UPDATE drivers SET status='Off Duty' WHERE id=?`).run(D("Priya Nair").id); // sabotage mid-flow
  expectThrow(() => svc.dispatchTrip(id3));
  if (V("Van-09").status !== "Available") throw new Error("vehicle flipped despite failed dispatch — NOT atomic");
  db.prepare(`UPDATE drivers SET status='Available' WHERE id=?`).run(D("Priya Nair").id);
  svc.cancelTrip(id3);
});

console.log(`\n${pass} passed, ${failCount} failed`);
process.exit(failCount ? 1 : 0);
