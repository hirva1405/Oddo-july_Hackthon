import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { addFuelLog, addExpense } from "@/lib/actions/fleet";
import ActionForm from "@/components/ActionForm";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await getSession();
  const fuel = db.prepare(`SELECT f.*, v.name vName FROM fuel_logs f JOIN vehicles v ON v.id=f.vehicleId ORDER BY f.date DESC LIMIT 30`).all();
  const expenses = db.prepare(`SELECT e.*, v.name vName FROM expenses e LEFT JOIN vehicles v ON v.id=e.vehicleId ORDER BY e.date DESC LIMIT 30`).all();
  const vehicles = db.prepare(`SELECT id, name FROM vehicles WHERE status != 'Retired' ORDER BY name`).all();
  const totals = db.prepare(`
    SELECT v.name, COALESCE(f.fc,0) fuelCost, COALESCE(m.mc,0) maintCost
    FROM vehicles v
    LEFT JOIN (SELECT vehicleId, SUM(cost) fc FROM fuel_logs GROUP BY vehicleId) f ON f.vehicleId = v.id
    LEFT JOIN (SELECT vehicleId, SUM(cost) mc FROM maintenance_logs GROUP BY vehicleId) m ON m.vehicleId = v.id
    WHERE v.status != 'Retired' ORDER BY (COALESCE(f.fc,0)+COALESCE(m.mc,0)) DESC LIMIT 6`).all();
  const canExpense = ["ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"].includes(session.role);

  return (
    <div className="flex flex-col gap-5">
      <Reveal><h2 className="font-display text-xl font-semibold">Fuel & expenses</h2></Reveal>

      <Reveal delay={50}>
        <div className="glass p-5">
          <p className="text-[11px] uppercase tracking-[2px] mb-4" style={{ color: "var(--low)" }}>Operational cost per vehicle (fuel + maintenance) — auto-computed</p>
          <div className="grid md:grid-cols-3 gap-3">
            {totals.map((t) => (
              <div key={t.name} className="glass-navy sheen p-4 rounded-2xl">
                <p className="text-[12.5px] font-semibold">{t.name}</p>
                <p className="font-display text-[22px] font-bold mt-1" style={{ color: "var(--gold)" }}>
                  ₹{(t.fuelCost + t.maintCost).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px]" style={{ color: "var(--mid)" }}>⛽ ₹{t.fuelCost.toLocaleString("en-IN")} · 🔧 ₹{t.maintCost.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-4">
        <Reveal delay={90}>
          <div className="glass p-5 h-full">
            <h3 className="font-display font-semibold text-[15px] mb-4">⛽ Fuel logs</h3>
            <ActionForm action={addFuelLog} submitLabel="Log fuel" small className="grid grid-cols-2 gap-3 mb-4">
              <div className="field col-span-2"><label>Vehicle</label>
                <select className="input" name="vehicleId" required>
                  <option value="">Select…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select></div>
              <div className="field"><label>Liters</label><input className="input" name="liters" type="number" step="0.1" min="0.1" required /></div>
              <div className="field"><label>Cost (₹)</label><input className="input" name="cost" type="number" min="0" required /></div>
            </ActionForm>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-auto pr-1">
              {fuel.map((f) => (
                <div key={f.id} className="flex justify-between text-[13px] px-3 py-2.5 rounded-lg" style={{ background: "rgba(228,214,189,.03)" }}>
                  <span><b>{f.vName}</b> · {f.liters} L</span>
                  <span style={{ color: "var(--mid)" }}>₹{f.cost.toLocaleString("en-IN")} · {f.date.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="glass p-5 h-full">
            <h3 className="font-display font-semibold text-[15px] mb-4">🧾 Other expenses</h3>
            {canExpense ? (
              <ActionForm action={addExpense} submitLabel="Add expense" small className="grid grid-cols-2 gap-3 mb-4">
                <div className="field"><label>Category</label>
                  <select className="input" name="category">{["Toll", "Repair", "Insurance", "Other"].map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="field"><label>Vehicle (optional)</label>
                  <select className="input" name="vehicleId"><option value="">— none —</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                <div className="field"><label>Description</label><input className="input" name="description" placeholder="NH-48 toll" required /></div>
                <div className="field"><label>Amount (₹)</label><input className="input" name="amount" type="number" min="0" required /></div>
              </ActionForm>
            ) : (
              <p className="text-[12.5px] mb-4" style={{ color: "var(--low)" }}>Your role can view expenses; adding them needs Finance/Manager/Admin.</p>
            )}
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-auto pr-1">
              {expenses.map((e) => (
                <div key={e.id} className="flex justify-between text-[13px] px-3 py-2.5 rounded-lg" style={{ background: "rgba(228,214,189,.03)" }}>
                  <span><span className="badge badge-gold !text-[9px] mr-2">{e.category.toUpperCase()}</span>{e.description}{e.vName ? ` · ${e.vName}` : ""}</span>
                  <span style={{ color: "var(--mid)" }}>₹{e.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
