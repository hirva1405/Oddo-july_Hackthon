import { db } from "@/lib/db";
import { dispatchableVehicles, eligibleDrivers } from "@/lib/services";
import { createTripAction, dispatchTripAction, completeTripAction, cancelTripAction } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";
import Link from "next/link";

export const dynamic = "force-dynamic";
const TABS = ["All", "Draft", "Dispatched", "Completed", "Cancelled"];

export default function TripsPage({ searchParams }) {
  const tab = TABS.includes(searchParams?.tab) ? searchParams.tab : "All";
  let sql = `SELECT t.*, v.name vName, v.registrationNumber vReg, v.maxLoadKg vCap, v.odometerKm vOdo, d.name dName
             FROM trips t JOIN vehicles v ON v.id=t.vehicleId JOIN drivers d ON d.id=t.driverId`;
  const args = [];
  if (tab !== "All") { sql += ` WHERE t.status = ?`; args.push(tab); }
  sql += ` ORDER BY t.createdAt DESC`;
  const trips = db.prepare(sql).all(...args);
  const vehicles = dispatchableVehicles();
  const drivers = eligibleDrivers();
  const allVehicles = db.prepare(`SELECT id,name,maxLoadKg FROM vehicles`).all();

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <h2 className="font-display text-xl font-semibold">Trip management</h2>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>
          Lifecycle: Draft → Dispatched → Completed / Cancelled. Only <b style={{ color: "var(--gold)" }}>Available</b> vehicles and{" "}
          <b style={{ color: "var(--gold)" }}>valid-license</b> drivers appear below — the rules filter them for you.
        </p>
      </Reveal>

      <Reveal delay={50}>
        <details className="glass p-5" open={trips.length === 0}>
          <summary className="cursor-pointer font-display font-semibold text-[14.5px] list-none flex items-center gap-3 flex-wrap">
            <span className="btn btn-gold btn-sm">＋ Create trip</span>
            <span className="text-[12px]" style={{ color: "var(--low)" }}>
              {vehicles.length} vehicles & {drivers.length} drivers currently eligible
            </span>
          </summary>
          <ActionForm action={createTripAction} submitLabel="Create draft trip" className="grid md:grid-cols-3 gap-4 mt-5">
            <div className="field"><label>Source</label><input className="input" name="source" placeholder="Vadodara" required /></div>
            <div className="field"><label>Destination</label><input className="input" name="destination" placeholder="Surat" required /></div>
            <div className="field"><label>Planned distance (km)</label><input className="input" name="plannedKm" type="number" min="1" placeholder="150" required /></div>
            <div className="field"><label>Vehicle (available only)</label>
              <select className="input" name="vehicleId" required>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · cap {v.maxLoadKg} kg</option>)}
              </select></div>
            <div className="field"><label>Driver (valid license only)</label>
              <select className="input" name="driverId" required>
                <option value="">Select driver…</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} · safety {d.safetyScore}</option>)}
              </select></div>
            <div className="field"><label>Cargo weight (kg)</label><input className="input" name="cargoWeightKg" type="number" min="1" placeholder="450" required /></div>
          </ActionForm>
        </details>
      </Reveal>

      <Reveal delay={90}>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <Link key={t} href={`/trips?tab=${t}`}
              className={`btn btn-sm ${tab === t ? "btn-gold" : ""}`}>{t}</Link>
          ))}
        </div>
      </Reveal>

      <div className="flex flex-col gap-3">
        {trips.length === 0 && (
          <Reveal><div className="glass p-8 text-center" style={{ color: "var(--mid)" }}>No {tab !== "All" ? tab.toLowerCase() : ""} trips yet.</div></Reveal>
        )}
        {trips.map((t, i) => (
          <Reveal key={t.id} delay={Math.min(i, 5) * 60}>
            <div className="glass p-5">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="font-display font-semibold text-[15.5px]">
                    {t.source} <span style={{ color: "var(--gold)" }}>→</span> {t.destination}
                  </p>
                  <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>
                    {t.vName} ({t.vReg}) · {t.dName} · cargo {t.cargoWeightKg} kg / cap {t.vCap} kg · {t.plannedKm} km planned
                    {t.status === "Completed" && t.revenue > 0 && <> · <span style={{ color: "#7FBF9E" }}>₹{t.revenue.toLocaleString("en-IN")} revenue</span></>}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.status === "Draft" && (
                <div className="flex gap-2 mt-4">
                  <ActionForm action={dispatchTripAction} submitLabel="🚛 Dispatch" small>
                    <input type="hidden" name="id" value={t.id} />
                  </ActionForm>
                  <ActionForm action={cancelTripAction} submitLabel="Cancel" danger small confirmText="Cancel this draft trip?">
                    <input type="hidden" name="id" value={t.id} />
                  </ActionForm>
                </div>
              )}

              {t.status === "Dispatched" && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(228,214,189,.07)" }}>
                  <p className="text-[11px] uppercase tracking-[2px] mb-3" style={{ color: "var(--low)" }}>Complete trip — enter final readings</p>
                  <ActionForm action={completeTripAction} submitLabel="✓ Complete trip" small className="grid md:grid-cols-5 gap-3 items-end">
                    <input type="hidden" name="id" value={t.id} />
                    <div className="field"><label>End odometer (km)</label>
                      <input className="input" name="endOdometerKm" type="number" min={t.vOdo} placeholder={`≥ ${t.vOdo}`} required /></div>
                    <div className="field"><label>Fuel used (L)</label>
                      <input className="input" name="fuelLiters" type="number" step="0.1" min="0" placeholder="14" /></div>
                    <div className="field"><label>Fuel cost (₹)</label>
                      <input className="input" name="fuelCost" type="number" min="0" placeholder="1430" /></div>
                    <div className="field"><label>Revenue (₹)</label>
                      <input className="input" name="revenue" type="number" min="0" placeholder="9500" /></div>
                  </ActionForm>
                  <div className="mt-2">
                    <ActionForm action={cancelTripAction} submitLabel="Cancel trip (restore both)" danger small
                      confirmText="Cancel this dispatched trip? Vehicle & driver return to Available.">
                      <input type="hidden" name="id" value={t.id} />
                    </ActionForm>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
