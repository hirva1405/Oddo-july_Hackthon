import Link from "next/link";
import { db } from "@/lib/db";
import { getKpis, getWeeklyCosts, getLicenseAlerts } from "@/lib/analytics";
import Reveal from "@/components/Reveal";
import TiltCard from "@/components/TiltCard";
import CountUp from "@/components/CountUp";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import RulesStrip from "@/components/RulesStrip";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const k = getKpis();
  const weeks = getWeeklyCosts();
  const maxW = Math.max(...weeks.map((w) => w.total), 1);
  const fleet = db.prepare(`SELECT * FROM vehicles WHERE status != 'Retired' ORDER BY
    CASE status WHEN 'On Trip' THEN 0 WHEN 'In Shop' THEN 1 ELSE 2 END, name LIMIT 6`).all();
  const recent = db.prepare(`
    SELECT t.*, v.name vName, v.maxLoadKg vCap, d.name dName FROM trips t
    JOIN vehicles v ON v.id = t.vehicleId JOIN drivers d ON d.id = t.driverId
    ORDER BY t.createdAt DESC LIMIT 8`).all();
  const activeTrips = recent.filter((t) => t.status === "Dispatched");
  const alerts = getLicenseAlerts();

  const kpis = [
    { label: "🟢 Available vehicles", value: k.availableVehicles, sub: `${k.activeVehicles} in active fleet` },
    { label: "🔵 Active trips", value: k.activeTrips, sub: `${k.pendingTrips} pending in Draft` },
    { label: "🟠 In maintenance", value: k.inMaintenance, sub: "hidden from dispatch" },
    { label: "⚡ Fleet utilization", value: k.fleetUtilization, unit: "%", sub: `${k.driversOnDuty} drivers on duty` },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* live ticker */}
      <Reveal>
        <div className="marq rounded-2xl">
          <div className="marq-fade-l" /><div className="marq-fade-r" />
          <div className="marq-track">
            {[0, 1].map((i) => (
              <span key={i} className="flex gap-4">
                {recent.map((t) => (
                  <span key={t.id + i} className="chip">
                    {t.status === "Dispatched" ? "🚛" : t.status === "Completed" ? "✓" : "◈"}{" "}
                    <b style={{ color: "var(--beige)" }}>{t.vName}</b> {t.source} → {t.destination} ·{" "}
                    <span style={{ color: t.status === "Completed" ? "#7FBF9E" : "var(--gold)" }}>{t.status}</span>
                  </span>
                ))}
                {alerts.slice(0, 2).map((a) => (
                  <span key={a.id + "al" + i} className="chip">
                    ⚠️ <b style={{ color: "var(--beige)" }}>{a.name}</b> license ·{" "}
                    <span style={{ color: "#CE7B6E" }}>{a.expired ? "EXPIRED" : `${a.daysLeft}d left`}</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 90}>
            <TiltCard className="glass-navy sheen p-5 h-full">
              <p className="text-[12px] flex items-center gap-2" style={{ color: "var(--mid)" }}>{kpi.label}</p>
              <p className="font-display text-[38px] font-bold tracking-tight mt-2">
                <CountUp value={kpi.value} />{kpi.unit && <span className="text-[19px]" style={{ color: "var(--mid)" }}>{kpi.unit}</span>}
              </p>
              <p className="text-[11.5px] mt-1 font-medium" style={{ color: "var(--gold)" }}>{kpi.sub}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-4">
        {/* animated Gujarat route map — the signature dashboard element */}
        <Reveal delay={120}>
          <RouteMap activeTrips={activeTrips} recentTrips={recent} />
        </Reveal>

        {/* live fleet */}
        <Reveal delay={200}>
          <div className="glass p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-[15.5px] flex items-center gap-2">
                <span className="pulse-dot" /> Live fleet
              </h3>
              <Link href="/vehicles" className="text-[12px] font-semibold" style={{ color: "var(--gold)" }}>All vehicles →</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              {fleet.map((v) => (
                <div key={v.id} className="flex justify-between items-center px-3.5 py-3 rounded-xl transition-all hover:translate-x-1"
                  style={{ background: "rgba(228,214,189,.03)", border: "1px solid transparent" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl grid place-items-center text-[16px]"
                      style={{ background: "linear-gradient(135deg, rgba(232,180,74,.16), rgba(201,149,48,.08))", border: "1px solid rgba(232,180,74,.2)" }}>
                      {v.type === "Truck" ? "🚚" : v.type === "Trailer" ? "🚛" : "🚐"}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{v.name} · {v.registrationNumber}</p>
                      <p className="text-[11px]" style={{ color: "var(--low)" }}>{v.model} · {v.maxLoadKg} kg</p>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* the rules-firing showcase — narrates the differentiation live */}
      <RulesStrip />

      {/* weekly cost chart, full width now */}
      <Reveal delay={140}>
        <div className="glass p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-semibold text-[15.5px]">Weekly operational cost</h3>
            <Link href="/reports" className="text-[12px] font-semibold" style={{ color: "var(--gold)" }}>View reports →</Link>
          </div>
          <div className="flex items-end gap-2.5 h-[170px]">
            {weeks.map((w, i) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full rounded-t-lg rounded-b transition-all group-hover:brightness-125 relative"
                  style={{
                    height: `${Math.max(6, (w.total / maxW) * 100)}%`,
                    background: i % 2
                      ? "linear-gradient(180deg, rgba(126,166,217,.6), rgba(126,166,217,.06))"
                      : "linear-gradient(180deg, rgba(232,180,74,.75), rgba(232,180,74,.08))",
                  }}
                  title={`₹${w.total.toLocaleString("en-IN")}`} />
                <span className="text-[10px]" style={{ color: "var(--low)" }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* quick actions */}
      <Reveal delay={260}>
        <div className="glass p-5 flex flex-wrap gap-3 items-center">
          <span className="text-[11px] uppercase tracking-[2px] mr-2" style={{ color: "var(--low)" }}>Quick actions</span>
          <Link href="/trips" className="btn btn-gold">+ New trip</Link>
          <Link href="/vehicles" className="btn">Register vehicle</Link>
          <Link href="/drivers" className="btn">Add driver</Link>
          <Link href="/maintenance" className="btn">Open maintenance</Link>
          <a href="/api/reports/csv" className="btn">⬇ Export CSV</a>
        </div>
      </Reveal>
    </div>
  );
}
