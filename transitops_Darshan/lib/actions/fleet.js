"use server";
import { revalidatePath } from "next/cache";
import { db, uid } from "@/lib/db";
import { requireRole, ROLES } from "@/lib/auth";
import * as svc from "@/lib/services";

const ok = (message) => ({ ok: true, message });
const fail = (e) => ({ ok: false, error: e.message || "Something went wrong" });
const isUnique = (e) => String(e.message || "").includes("UNIQUE constraint failed");

// ---------- Vehicles (Fleet Manager + Admin) ----------
export async function createVehicle(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    db.prepare(`INSERT INTO vehicles (id,registrationNumber,name,model,type,maxLoadKg,odometerKm,acquisitionCost)
                VALUES (?,?,?,?,?,?,?,?)`)
      .run(uid(),
        fd.get("registrationNumber").toString().trim().toUpperCase(),
        fd.get("name").toString().trim(),
        fd.get("model").toString().trim(),
        fd.get("type").toString(),
        Number(fd.get("maxLoadKg")),
        Number(fd.get("odometerKm") || 0),
        Number(fd.get("acquisitionCost")));
    revalidatePath("/vehicles");
    return ok("Vehicle registered");
  } catch (e) {
    if (isUnique(e)) return { ok: false, error: "Registration number must be unique — that one already exists" }; // Rule 1
    return fail(e);
  }
}

export async function retireVehicle(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    const v = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(fd.get("id").toString());
    if (!v) return { ok: false, error: "Vehicle not found" };
    if (v.status === "On Trip") return { ok: false, error: "Vehicle is On Trip — cannot retire now" };
    db.prepare(`UPDATE vehicles SET status='Retired' WHERE id=?`).run(v.id);
    revalidatePath("/vehicles");
    return ok(`${v.name} retired`);
  } catch (e) { return fail(e); }
}

// ---------- Drivers (Fleet Manager, Safety Officer, Admin) ----------
export async function createDriver(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER");
    db.prepare(`INSERT INTO drivers (id,name,licenseNumber,licenseCategory,licenseExpiry,contactNumber,safetyScore)
                VALUES (?,?,?,?,?,?,?)`)
      .run(uid(),
        fd.get("name").toString().trim(),
        fd.get("licenseNumber").toString().trim().toUpperCase(),
        fd.get("licenseCategory").toString(),
        new Date(fd.get("licenseExpiry").toString()).toISOString(),
        fd.get("contactNumber").toString().trim(),
        Number(fd.get("safetyScore") || 80));
    revalidatePath("/drivers");
    return ok("Driver added");
  } catch (e) {
    if (isUnique(e)) return { ok: false, error: "License number already exists" };
    return fail(e);
  }
}

export async function setDriverStatus(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER");
    const d = db.prepare(`SELECT * FROM drivers WHERE id=?`).get(fd.get("id").toString());
    const status = fd.get("status").toString();
    if (!d) return { ok: false, error: "Driver not found" };
    if (d.status === "On Trip") return { ok: false, error: `${d.name} is On Trip — complete the trip first` };
    if (!["Available", "Off Duty", "Suspended"].includes(status)) return { ok: false, error: "Invalid status" };
    db.prepare(`UPDATE drivers SET status=? WHERE id=?`).run(status, d.id);
    revalidatePath("/drivers");
    return ok(`${d.name} → ${status}`);
  } catch (e) { return fail(e); }
}

// ---------- Trips ----------
const touchAll = () => { ["/trips", "/vehicles", "/drivers", "/"].forEach((p) => revalidatePath(p)); };

export async function createTripAction(prev, fd) {
  try {
    await requireRole(...ROLES);
    svc.createTrip({
      source: fd.get("source").toString().trim(),
      destination: fd.get("destination").toString().trim(),
      vehicleId: fd.get("vehicleId").toString(),
      driverId: fd.get("driverId").toString(),
      cargoWeightKg: fd.get("cargoWeightKg"),
      plannedKm: fd.get("plannedKm"),
    });
    revalidatePath("/trips");
    return ok("Trip created as Draft");
  } catch (e) { return fail(e); }
}

export async function dispatchTripAction(prev, fd) {
  try { await requireRole(...ROLES); svc.dispatchTrip(fd.get("id").toString()); touchAll();
    return ok("Dispatched — vehicle & driver are now On Trip"); } catch (e) { return fail(e); }
}

export async function completeTripAction(prev, fd) {
  try {
    await requireRole(...ROLES);
    svc.completeTrip(fd.get("id").toString(), {
      endOdometerKm: fd.get("endOdometerKm"),
      fuelLiters: fd.get("fuelLiters"),
      fuelCost: fd.get("fuelCost"),
      revenue: fd.get("revenue"),
    });
    touchAll();
    return ok("Trip completed — vehicle & driver are Available again");
  } catch (e) { return fail(e); }
}

export async function cancelTripAction(prev, fd) {
  try { await requireRole(...ROLES); svc.cancelTrip(fd.get("id").toString()); touchAll();
    return ok("Trip cancelled"); } catch (e) { return fail(e); }
}

// ---------- Maintenance (Fleet Manager + Admin) ----------
export async function openMaintenanceAction(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    svc.openMaintenance(fd.get("vehicleId").toString(), {
      description: fd.get("description").toString().trim(),
      cost: fd.get("cost"),
    });
    ["/maintenance", "/vehicles", "/"].forEach((p) => revalidatePath(p));
    return ok("Maintenance opened — vehicle moved to In Shop");
  } catch (e) { return fail(e); }
}

export async function closeMaintenanceAction(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER");
    svc.closeMaintenance(fd.get("id").toString());
    ["/maintenance", "/vehicles", "/"].forEach((p) => revalidatePath(p));
    return ok("Maintenance closed — vehicle restored");
  } catch (e) { return fail(e); }
}

// ---------- Fuel & Expenses ----------
export async function addFuelLog(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST", "DRIVER");
    db.prepare(`INSERT INTO fuel_logs (id,vehicleId,liters,cost,date) VALUES (?,?,?,?,?)`)
      .run(uid(), fd.get("vehicleId").toString(), Number(fd.get("liters")), Number(fd.get("cost")),
        fd.get("date") ? new Date(fd.get("date").toString()).toISOString() : new Date().toISOString());
    revalidatePath("/expenses");
    return ok("Fuel log recorded");
  } catch (e) { return fail(e); }
}

export async function addExpense(prev, fd) {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST");
    db.prepare(`INSERT INTO expenses (id,category,description,amount,vehicleId,date) VALUES (?,?,?,?,?,?)`)
      .run(uid(), fd.get("category").toString(), fd.get("description").toString().trim(),
        Number(fd.get("amount")), fd.get("vehicleId")?.toString() || null,
        fd.get("date") ? new Date(fd.get("date").toString()).toISOString() : new Date().toISOString());
    revalidatePath("/expenses");
    return ok("Expense recorded");
  } catch (e) { return fail(e); }
}

// ---------- Users (Admin only) ----------
export async function setUserRole(prev, fd) {
  try {
    const session = await requireRole("ADMIN");
    const id = fd.get("id").toString();
    const role = fd.get("role").toString();
    if (!ROLES.includes(role)) return { ok: false, error: "Invalid role" };
    if (id === session.id) return { ok: false, error: "You can't change your own role" };
    db.prepare(`UPDATE users SET role=? WHERE id=?`).run(role, id);
    revalidatePath("/users");
    return ok("Role updated");
  } catch (e) { return fail(e); }
}
