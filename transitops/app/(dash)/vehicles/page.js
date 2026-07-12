import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createVehicle, retireVehicle } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({ searchParams }) {
  const session = await getSession();
  const q = (searchParams?.q || "").trim();
  const status = searchParams?.status || "";
  const type = searchParams?.type || "";
  let sql = `SELECT * FROM vehicles WHERE 1=1`;
  const args = [];
  if (q) { sql += ` AND (name LIKE ? OR registrationNumber LIKE ? OR model LIKE ?)`; args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (status) { sql += ` AND status = ?`; args.push(status); }
  if (type) { sql += ` AND type = ?`; args.push(type); }
  sql += ` ORDER BY name`;
  const vehicles = db.prepare(sql).all(...args);
  const canManage = ["ADMIN", "FLEET_MANAGER"].includes(session.role);

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-xl font-semibold">Vehicle registry <span className="text-sm font-normal" style={{ color: "var(--low)" }}>· {vehicles.length} shown</span></h2>
          <form className="flex gap-2 flex-wrap">
            <input className="input !w-[210px]" name="q" defaultValue={q} placeholder="Search name / reg / model…" />
            <select className="input !w-[140px]" name="status" defaultValue={status}>
              <option value="">All statuses</option>
              {["Available", "On Trip", "In Shop", "Retired"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input !w-[140px]" name="type" defaultValue={type}>
              <option value="">All types</option>
              {["Van", "Truck", "Mini Truck", "Trailer"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn">Filter</button>
          </form>
        </div>
      </Reveal>

      {canManage && (
        <Reveal delay={60}>
          <details className="glass p-5 group">
            <summary className="cursor-pointer font-display font-semibold text-[14.5px] list-none flex items-center gap-2">
              <span className="btn btn-gold btn-sm">＋ Register vehicle</span>
              <span className="text-[12px]" style={{ color: "var(--low)" }}>Rule 1: registration number must be unique</span>
            </summary>
            <ActionForm action={createVehicle} submitLabel="Register vehicle" className="grid md:grid-cols-3 gap-4 mt-5">
              <div className="field"><label>Registration number</label><input className="input" name="registrationNumber" placeholder="GJ-06-AB-1234" required /></div>
              <div className="field"><label>Vehicle name</label><input className="input" name="name" placeholder="Van-06" required /></div>
              <div className="field"><label>Model</label><input className="input" name="model" placeholder="Tata Ace Gold" required /></div>
              <div className="field"><label>Type</label>
                <select className="input" name="type">{["Van", "Truck", "Mini Truck", "Trailer"].map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="field"><label>Max load (kg)</label><input className="input" name="maxLoadKg" type="number" min="1" placeholder="500" required /></div>
              <div className="field"><label>Odometer (km)</label><input className="input" name="odometerKm" type="number" min="0" placeholder="0" /></div>
              <div className="field md:col-span-2"><label>Acquisition cost (₹)</label><input className="input" name="acquisitionCost" type="number" min="0" placeholder="450000" required /></div>
            </ActionForm>
          </details>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="glass overflow-x-auto">
          <table className="tbl">
            <thead><tr>
              <th>Vehicle</th><th>Registration</th><th>Type</th><th>Capacity</th><th>Odometer</th><th>Acq. cost</th><th>Status</th>{canManage && <th></th>}
            </tr></thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="font-semibold">
                    <a href={`/vehicles/${v.id}`} className="hover:underline" style={{ color: "var(--gold)" }}>{v.name}</a>
                    <div className="text-[11px] font-normal" style={{ color: "var(--low)" }}>{v.model}</div>
                  </td>
                  <td style={{ color: "var(--mid)" }}>{v.registrationNumber}</td>
                  <td style={{ color: "var(--mid)" }}>{v.type}</td>
                  <td>{v.maxLoadKg.toLocaleString("en-IN")} kg</td>
                  <td>{v.odometerKm.toLocaleString("en-IN")} km</td>
                  <td>₹{v.acquisitionCost.toLocaleString("en-IN")}</td>
                  <td><StatusBadge status={v.status} /></td>
                  {canManage && (
                    <td>
                      {v.status !== "Retired" && v.status !== "On Trip" && (
                        <ActionForm action={retireVehicle} submitLabel="Retire" danger small
                          confirmText={`Retire ${v.name}? It will never appear in dispatch again.`}>
                          <input type="hidden" name="id" value={v.id} />
                        </ActionForm>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
