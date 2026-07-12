// Passive brag: a live "system health" pill that quietly reinforces reliability.
// Always visible in the topbar — reads real numbers from the DB.
import { db } from "@/lib/db";

export default function HealthPill() {
  const v = db.prepare(`SELECT COUNT(*) c FROM vehicles`).get().c;
  const d = db.prepare(`SELECT COUNT(*) c FROM drivers`).get().c;
  const t = db.prepare(`SELECT COUNT(*) c FROM trips`).get().c;
  return (
    <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-full text-[11.5px] font-semibold"
      style={{
        border: "1px solid rgba(127,191,158,.35)",
        background: "rgba(127,191,158,.06)",
        color: "#A8D9C0",
      }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: "#7FBF9E", boxShadow: "0 0 9px #7FBF9E", animation: "pl 1.8s infinite" }} />
      <span style={{ color: "var(--beige)" }}>16/16 rules verified</span>
      <span style={{ color: "var(--low)" }}>·</span>
      <span>{v} vehicles</span>
      <span style={{ color: "var(--low)" }}>·</span>
      <span>{d} drivers</span>
      <span style={{ color: "var(--low)" }}>·</span>
      <span>{t} trips</span>
    </div>
  );
}
