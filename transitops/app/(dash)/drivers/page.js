import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createDriver, setDriverStatus } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function DriversPage({ searchParams }) {
  const session = await getSession();
  const q = (searchParams?.q || "").trim();
  let sql = `SELECT * FROM drivers WHERE 1=1`;
  const args = [];
  if (q) { sql += ` AND (name LIKE ? OR licenseNumber LIKE ?)`; args.push(`%${q}%`, `%${q}%`); }
  sql += ` ORDER BY name`;
  const drivers = db.prepare(sql).all(...args);
  const canManage = ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER"].includes(session.role);
  const now = new Date().toISOString();
  const soon = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display text-xl font-semibold">Drivers <span className="text-sm font-normal" style={{ color: "var(--low)" }}>· {drivers.length} shown</span></h2>
          <form className="flex gap-2">
            <input className="input !w-[230px]" name="q" defaultValue={q} placeholder="Search name / license…" />
            <button className="btn">Search</button>
          </form>
        </div>
      </Reveal>

      {canManage && (
        <Reveal delay={60}>
          <details className="glass p-5">
            <summary className="cursor-pointer font-display font-semibold text-[14.5px] list-none flex items-center gap-2">
              <span className="btn btn-gold btn-sm">＋ Add driver</span>
              <span className="text-[12px]" style={{ color: "var(--low)" }}>Rule 3: expired licenses are auto-blocked from dispatch</span>
            </summary>
            <ActionForm action={createDriver} submitLabel="Add driver" className="grid md:grid-cols-3 gap-4 mt-5">
              <div className="field"><label>Name</label><input className="input" name="name" placeholder="Ravi Patel" required /></div>
              <div className="field"><label>License number</label><input className="input" name="licenseNumber" placeholder="GJ06-2024-0012345" required /></div>
              <div className="field"><label>License category</label>
                <select className="input" name="licenseCategory">{["LMV", "HMV", "Transport"].map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>License expiry</label><input className="input" name="licenseExpiry" type="date" required /></div>
              <div className="field"><label>Contact number</label><input className="input" name="contactNumber" placeholder="+91 98250 00000" required /></div>
              <div className="field"><label>Safety score (0–100)</label><input className="input" name="safetyScore" type="number" min="0" max="100" placeholder="80" /></div>
            </ActionForm>
          </details>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="glass overflow-x-auto">
          <table className="tbl">
            <thead><tr>
              <th>Driver</th><th>License</th><th>Category</th><th>Expiry</th><th>Safety</th><th>Status</th>{canManage && <th>Set status</th>}
            </tr></thead>
            <tbody>
              {drivers.map((d) => {
                const expired = d.licenseExpiry <= now;
                const expSoon = !expired && d.licenseExpiry < soon;
                return (
                  <tr key={d.id}>
                    <td className="font-semibold">{d.name}<div className="text-[11px] font-normal" style={{ color: "var(--low)" }}>{d.contactNumber}</div></td>
                    <td style={{ color: "var(--mid)" }}>{d.licenseNumber}</td>
                    <td style={{ color: "var(--mid)" }}>{d.licenseCategory}</td>
                    <td>
                      <span style={{ color: expired ? "#CE7B6E" : expSoon ? "#D9A46B" : "var(--hi)" }}>
                        {d.licenseExpiry.slice(0, 10)} {expired ? "🚫" : expSoon ? "⚠️" : ""}
                      </span>
                    </td>
                    <td>
                      <span className="font-display font-bold" style={{ color: d.safetyScore >= 80 ? "#7FBF9E" : d.safetyScore >= 60 ? "#D9A46B" : "#CE7B6E" }}>
                        {d.safetyScore}
                      </span>
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    {canManage && (
                      <td>
                        {d.status !== "On Trip" && (
                          <ActionForm action={setDriverStatus} submitLabel="Set" small className="flex gap-2 items-center">
                            <input type="hidden" name="id" value={d.id} />
                            <select className="input !w-[125px] !py-1.5 !text-xs" name="status" defaultValue={d.status}>
                              {["Available", "Off Duty", "Suspended"].map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </ActionForm>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
