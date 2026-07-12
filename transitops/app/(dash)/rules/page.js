import Reveal from "@/components/Reveal";

const RULES = [
  { n: "01", title: "Unique registration number", desc: "Two vehicles can never share a registration.", enforce: "SQL UNIQUE constraint on vehicles.registrationNumber", file: "lib/db.js", demo: "Try registering GJ-06-AB-1234 again — blocked at the database." },
  { n: "02", title: "Retired & In-Shop vehicles hidden", desc: "Only Available vehicles ever appear in dispatch dropdowns.", enforce: "dispatchableVehicles() query filter", file: "lib/services.js", demo: "Van-11 (In Shop) & Van-01 (Retired) are absent from Trips → Create." },
  { n: "03", title: "Expired-license drivers blocked", desc: "License validity checked at every trip creation and dispatch.", enforce: "createTrip() + dispatchTrip() validation", file: "lib/services.js", demo: "Alex Fernandes (license expired 10d ago) can't be selected." },
  { n: "04", title: "No double-assignment", desc: "A vehicle or driver already On Trip cannot be assigned again.", enforce: "Status check inside transaction", file: "lib/services.js", demo: "Truck-02 & Imran (currently On Trip) are excluded from pools." },
  { n: "05", title: "Cargo ≤ capacity", desc: "Overweight cargo blocked at create AND dispatch.", enforce: "Cargo vs. maxLoadKg check", file: "lib/services.js", demo: "Try 550 kg into Van-05 (500 kg cap) — red toast." },
  { n: "06", title: "Dispatch flips both statuses atomically", desc: "Vehicle & driver → On Trip in one SQL transaction.", enforce: "db.transaction(dispatchTrip)", file: "lib/services.js", demo: "Dispatch a Draft trip — watch statuses update in lockstep." },
  { n: "07", title: "Completion restores both", desc: "End odometer + fuel logged, both restored to Available.", enforce: "db.transaction(completeTrip)", file: "lib/services.js", demo: "Complete the Truck-02 trip — instant restoration." },
  { n: "08", title: "Cancel dispatched restores both", desc: "Cancelled trips return vehicle + driver to Available.", enforce: "db.transaction(cancelTrip)", file: "lib/services.js", demo: "Cancel any Dispatched trip — statuses roll back." },
  { n: "09", title: "Maintenance → In Shop, hidden", desc: "Opening a log removes the vehicle from every dispatch pool.", enforce: "db.transaction(openMaintenance)", file: "lib/services.js", demo: "Open a maintenance log — vehicle disappears from Trips." },
  { n: "10", title: "Close maintenance → Available", desc: "Restoration is skipped only if the vehicle is Retired.", enforce: "db.transaction(closeMaintenance)", file: "lib/services.js", demo: "Close Van-11's open log — instantly back to Available." },
];

export default function RulesPage() {
  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <div>
          <h2 className="font-display text-2xl font-bold">The 10 mandatory rules</h2>
          <p className="text-[13px] mt-1.5" style={{ color: "var(--mid)" }}>
            Every rule from the spec, mapped to the exact code that enforces it. All 10 verified by an automated 16-test suite (
            <code style={{ color: "var(--gold)" }}>node scripts/test-rules.mjs</code>).
          </p>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-4">
        {RULES.map((r, i) => (
          <Reveal key={r.n} delay={i * 40}>
            <div className="glass p-5 h-full relative overflow-hidden group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-display text-[11.5px] font-bold tracking-[2.4px]" style={{ color: "var(--gold)" }}>RULE — {r.n}</div>
                  <h3 className="font-display font-semibold text-[15.5px] mt-1">{r.title}</h3>
                </div>
                <span className="badge badge-ok"><span className="dot" />PASSING</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--mid)" }}>{r.desc}</p>
              <div className="mt-3.5 rounded-lg px-3.5 py-2.5 text-[12px] font-mono flex justify-between items-center gap-3 flex-wrap"
                style={{ background: "rgba(6,6,7,.55)", border: "1px solid var(--line)", color: "var(--beige)" }}>
                <span>{r.enforce}</span>
                <span style={{ color: "var(--low)" }}>{r.file}</span>
              </div>
              <div className="mt-2.5 text-[11.5px] flex items-start gap-2" style={{ color: "var(--mid)" }}>
                <span style={{ color: "var(--gold)" }}>▸</span> {r.demo}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={500}>
        <div className="glass p-6 text-center">
          <div className="text-[11px] uppercase tracking-[3px] mb-2" style={{ color: "var(--low)" }}>Test suite output</div>
          <p className="font-display text-[26px] font-bold" style={{ color: "#7FBF9E" }}>16 passed · 0 failed</p>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>Includes an atomicity test that sabotages a dispatch mid-flow and verifies nothing half-commits.</p>
        </div>
      </Reveal>
    </div>
  );
}
