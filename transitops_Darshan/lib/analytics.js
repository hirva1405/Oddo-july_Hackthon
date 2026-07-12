// Dashboard KPIs and Reports math (Sections 3.2 + 3.8 of the spec)
import { db } from "./db.js";

export function getKpis() {
  const vehicles = db.prepare(`SELECT * FROM vehicles`).all();
  const drivers = db.prepare(`SELECT * FROM drivers`).all();
  const trips = db.prepare(`SELECT status FROM trips`).all();
  const activeFleet = vehicles.filter((v) => v.status !== "Retired");
  const onTrip = vehicles.filter((v) => v.status === "On Trip").length;
  return {
    activeVehicles: activeFleet.length,
    availableVehicles: vehicles.filter((v) => v.status === "Available").length,
    inMaintenance: vehicles.filter((v) => v.status === "In Shop").length,
    activeTrips: trips.filter((t) => t.status === "Dispatched").length,
    pendingTrips: trips.filter((t) => t.status === "Draft").length,
    driversOnDuty: drivers.filter((d) => ["Available", "On Trip"].includes(d.status)).length,
    fleetUtilization: activeFleet.length ? Math.round((onTrip / activeFleet.length) * 100) : 0,
  };
}

// Per-vehicle: Fuel Efficiency (km/L), Operational Cost (Fuel+Maintenance),
// ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
export function getVehicleReports() {
  const vehicles = db.prepare(`SELECT * FROM vehicles ORDER BY name`).all();
  const q = {
    trips: db.prepare(`SELECT * FROM trips WHERE vehicleId=? AND status='Completed'`),
    fuel: db.prepare(`SELECT COALESCE(SUM(liters),0) l, COALESCE(SUM(cost),0) c FROM fuel_logs WHERE vehicleId=?`),
    maint: db.prepare(`SELECT COALESCE(SUM(cost),0) c FROM maintenance_logs WHERE vehicleId=?`),
  };
  return vehicles.map((v) => {
    const completed = q.trips.all(v.id);
    const distanceKm = completed.reduce(
      (s, t) => s + (((t.endOdometerKm ?? 0) - (t.startOdometerKm ?? 0)) || t.plannedKm), 0);
    const { l: fuelLiters, c: fuelCost } = q.fuel.get(v.id);
    const maintenanceCost = q.maint.get(v.id).c;
    const revenue = completed.reduce((s, t) => s + t.revenue, 0);
    const operationalCost = fuelCost + maintenanceCost;
    return {
      id: v.id, name: v.name, registrationNumber: v.registrationNumber, type: v.type, status: v.status,
      tripsCompleted: completed.length, distanceKm: Math.round(distanceKm),
      fuelLiters: +fuelLiters.toFixed(1), fuelCost, maintenanceCost, operationalCost, revenue,
      fuelEfficiency: fuelLiters > 0 ? +(distanceKm / fuelLiters).toFixed(2) : 0,
      roi: v.acquisitionCost > 0 ? +(((revenue - operationalCost) / v.acquisitionCost) * 100).toFixed(2) : 0,
    };
  });
}

// Licenses expired or expiring within 30 days — feeds topbar notifications
export function getLicenseAlerts() {
  const soon = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  return db.prepare(`SELECT * FROM drivers WHERE licenseExpiry < ? ORDER BY licenseExpiry`).all(soon)
    .map((d) => ({
      ...d,
      expired: d.licenseExpiry <= new Date().toISOString(),
      daysLeft: Math.ceil((new Date(d.licenseExpiry) - new Date()) / (24 * 3600 * 1000)),
    }));
}

// Weekly operational cost for the dashboard chart (last 8 weeks: fuel + maintenance + expenses)
export function getWeeklyCosts() {
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 24 * 3600 * 1000).toISOString();
    const end = new Date(Date.now() - i * 7 * 24 * 3600 * 1000).toISOString();
    const fuel = db.prepare(`SELECT COALESCE(SUM(cost),0) c FROM fuel_logs WHERE date>=? AND date<?`).get(start, end).c;
    const maint = db.prepare(`SELECT COALESCE(SUM(cost),0) c FROM maintenance_logs WHERE openedAt>=? AND openedAt<?`).get(start, end).c;
    const exp = db.prepare(`SELECT COALESCE(SUM(amount),0) c FROM expenses WHERE date>=? AND date<?`).get(start, end).c;
    weeks.push({ label: `W${8 - i}`, total: fuel + maint + exp });
  }
  return weeks;
}
