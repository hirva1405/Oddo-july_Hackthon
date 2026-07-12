// A live "how many dispatches did the rules just save you from" strip.
// Purely computed from the seeded/live database — no fake numbers.

import { db } from "@/lib/db";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

export default function RulesStrip() {
  const soon = new Date(Date.now() + 30 * 86400000).toISOString();
  const now = new Date().toISOString();

  // Rule 1: how many unique registrations we've enforced
  const uniqueRegs = db.prepare(`SELECT COUNT(*) c FROM vehicles`).get().c;

  // Rule 3: expired-license + suspended drivers currently locked out
  const lockedDrivers = db.prepare(
    `SELECT COUNT(*) c FROM drivers WHERE licenseExpiry <= ? OR status = 'Suspended'`
  ).get(now).c;

  // Rule 2/4: vehicles currently ineligible for dispatch
  const lockedVehicles = db.prepare(
    `SELECT COUNT(*) c FROM vehicles WHERE status IN ('In Shop','On Trip','Retired')`
  ).get().c;

  // Rule 6/7: atomic status flips that have run — completed + cancelled + dispatched trips
  const flips = db.prepare(
    `SELECT COUNT(*) c FROM trips WHERE status IN ('Dispatched','Completed','Cancelled')`
  ).get().c * 2; // vehicle + driver per flip

  // license expiry alerts within 30 days
  const expiringSoon = db.prepare(`SELECT COUNT(*) c FROM drivers WHERE licenseExpiry < ? AND licenseExpiry > ?`).get(soon, now).c;

  const items = [
    { rule: "RULE 01", label: "Unique registrations enforced", value: uniqueRegs, hint: "no duplicates possible" },
    { rule: "RULES 2·3", label: "Drivers & vehicles locked from dispatch", value: lockedDrivers + lockedVehicles, hint: "expired · suspended · in shop · on trip" },
    { rule: "RULES 6·7", label: "Atomic status flips executed", value: flips, hint: "vehicle + driver, transaction-safe" },
    { rule: "ALERTS", label: "Licenses expiring in 30 days", value: expiringSoon, hint: "surfaced automatically" },
  ];

  return (
    <Reveal>
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span className="text-[11px] uppercase tracking-[2px]" style={{ color: "var(--gold)" }}>
              Zero-trust dispatching · rules working in real time
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--low)" }}>seeded from live DB</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it, i) => (
            <div key={it.rule} className="glass-navy sheen p-4 rounded-2xl relative overflow-hidden">
              <div className="text-[10px] font-bold tracking-[2px]" style={{ color: "var(--gold)" }}>
                {it.rule}
              </div>
              <div className="font-display text-[30px] font-bold mt-1" style={{ color: "var(--hi)" }}>
                <CountUp value={it.value} duration={1500} />
              </div>
              <div className="text-[11.5px] font-semibold" style={{ color: "var(--beige)" }}>
                {it.label}
              </div>
              <div className="text-[10.5px] mt-1" style={{ color: "var(--low)" }}>
                {it.hint}
              </div>
              {/* subtle animated bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
                  animation: `slide 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes slide { 0%,100% { transform: translateX(-100%); opacity: 0; } 50% { transform: translateX(0); opacity: 1; } }`}</style>
      </div>
    </Reveal>
  );
}
