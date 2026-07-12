import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { openMaintenanceAction, closeMaintenanceAction } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const session = await getSession();
  const logs = db.prepare(`
    SELECT m.*, v.name vName, v.registrationNumber vReg, v.status vStatus FROM maintenance_logs m
    JOIN vehicles v ON v.id = m.vehicleId
    ORDER BY CASE m.status WHEN 'Open' THEN 0 ELSE 1 END, m.openedAt DESC`).all();
  const serviceable = db.prepare(`SELECT id, name FROM vehicles WHERE status IN ('Available','In Shop') ORDER BY name`).all();
  const canManage = ["ADMIN", "FLEET_MANAGER"].includes(session.role);

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <h2 className="font-display text-xl font-semibold">Maintenance</h2>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>
          Rule 9: opening a log flips the vehicle to <b style={{ color: "#D9A46B" }}>In Shop</b> and hides it from dispatch.
          Rule 10: closing restores it to <b style={{ color: "#7FBF9E" }}>Available</b>.
        </p>
      </Reveal>

      {canManage && (
        <Reveal delay={60}>
          <details className="glass p-5">
            <summary className="cursor-pointer list-none"><span className="btn btn-gold btn-sm">＋ Open maintenance</span></summary>
            <ActionForm action={openMaintenanceAction} submitLabel="Open — move to In Shop" className="grid md:grid-cols-3 gap-4 mt-5">
              <div className="field"><label>Vehicle</label>
                <select className="input" name="vehicleId" required>
                  <option value="">Select vehicle…</option>
                  {serviceable.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select></div>
              <div className="field"><label>Description</label><input className="input" name="description" placeholder="Oil change" required /></div>
              <div className="field"><label>Estimated cost (₹)</label><input className="input" name="cost" type="number" min="0" placeholder="4800" /></div>
            </ActionForm>
          </details>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="glass overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Vehicle</th><th>Work</th><th>Cost</th><th>Opened</th><th>Closed</th><th>Status</th>{canManage && <th></th>}</tr></thead>
            <tbody>
              {logs.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{m.vName}<div className="text-[11px] font-normal" style={{ color: "var(--low)" }}>{m.vReg}</div></td>
                  <td style={{ color: "var(--mid)" }}>{m.description}</td>
                  <td>₹{m.cost.toLocaleString("en-IN")}</td>
                  <td style={{ color: "var(--mid)" }}>{m.openedAt.slice(0, 10)}</td>
                  <td style={{ color: "var(--mid)" }}>{m.closedAt ? m.closedAt.slice(0, 10) : "—"}</td>
                  <td><StatusBadge status={m.status} /></td>
                  {canManage && (
                    <td>
                      {m.status === "Open" && (
                        <ActionForm action={closeMaintenanceAction} submitLabel="Close — restore vehicle" small>
                          <input type="hidden" name="id" value={m.id} />
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
