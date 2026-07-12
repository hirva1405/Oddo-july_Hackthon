import { getVehicleReports } from "@/lib/analytics";
import Reveal from "@/components/Reveal";
import StatusBadge from "@/components/StatusBadge";
import PdfButton from "@/components/PdfButton";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const rows = getVehicleReports().filter((r) => r.status !== "Retired" || r.tripsCompleted > 0);
  const best = [...rows].filter((r) => r.fuelEfficiency > 0).sort((a, b) => b.fuelEfficiency - a.fuelEfficiency)[0];
  const costliest = [...rows].sort((a, b) => b.operationalCost - a.operationalCost)[0];
  const bestRoi = [...rows].sort((a, b) => b.roi - a.roi)[0];
  const maxCost = Math.max(...rows.map((r) => r.operationalCost), 1);

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Reports & analytics</h2>
            <p className="text-[12.5px] mt-1" style={{ color: "var(--mid)" }}>
              ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost
            </p>
          </div>
          <div className="flex gap-2">
            <PdfButton rows={rows} />
            <a href="/api/reports/csv" className="btn btn-gold">⬇ Export CSV</a>
          </div>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          best && { t: "Best fuel efficiency", v: `${best.fuelEfficiency} km/L`, s: best.name },
          costliest && { t: "Highest operational cost", v: `₹${costliest.operationalCost.toLocaleString("en-IN")}`, s: costliest.name },
          bestRoi && { t: "Best ROI", v: `${bestRoi.roi}%`, s: bestRoi.name },
        ].filter(Boolean).map((c, i) => (
          <Reveal key={c.t} delay={i * 80}>
            <div className="glass-navy sheen p-5 rounded-2xl">
              <p className="text-[11px] uppercase tracking-[2px]" style={{ color: "var(--low)" }}>{c.t}</p>
              <p className="font-display text-[26px] font-bold mt-2" style={{ color: "var(--gold)" }}>{c.v}</p>
              <p className="text-[12.5px]" style={{ color: "var(--mid)" }}>{c.s}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={160}>
        <div className="glass p-5">
          <p className="text-[11px] uppercase tracking-[2px] mb-4" style={{ color: "var(--low)" }}>Operational cost by vehicle</p>
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-[92px] text-[12.5px] font-semibold shrink-0">{r.name}</span>
                <div className="flex-1 h-[22px] rounded-lg overflow-hidden" style={{ background: "rgba(228,214,189,.05)" }}>
                  <div className="h-full rounded-lg transition-all"
                    style={{
                      width: `${Math.max(2, (r.operationalCost / maxCost) * 100)}%`,
                      background: "linear-gradient(90deg, rgba(232,180,74,.75), rgba(201,149,48,.35))",
                    }} />
                </div>
                <span className="w-[90px] text-right text-[12.5px]" style={{ color: "var(--mid)" }}>₹{r.operationalCost.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={220}>
        <div className="glass overflow-x-auto">
          <table className="tbl">
            <thead><tr>
              <th>Vehicle</th><th>Status</th><th>Trips</th><th>Distance</th><th>Fuel</th>
              <th>Efficiency</th><th>Op. cost</th><th>Revenue</th><th>ROI</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.name}<div className="text-[11px] font-normal" style={{ color: "var(--low)" }}>{r.registrationNumber}</div></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.tripsCompleted}</td>
                  <td>{r.distanceKm.toLocaleString("en-IN")} km</td>
                  <td>{r.fuelLiters} L</td>
                  <td className="font-display font-bold">{r.fuelEfficiency > 0 ? `${r.fuelEfficiency} km/L` : "—"}</td>
                  <td>₹{r.operationalCost.toLocaleString("en-IN")}</td>
                  <td style={{ color: "#7FBF9E" }}>₹{r.revenue.toLocaleString("en-IN")}</td>
                  <td>
                    <span className="font-display font-bold" style={{ color: r.roi > 0 ? "#7FBF9E" : r.roi < 0 ? "#CE7B6E" : "var(--mid)" }}>
                      {r.roi > 0 ? "+" : ""}{r.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
