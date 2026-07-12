import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadDocument, deleteDocument } from "@/lib/actions/docs";
import ActionForm from "@/components/ActionForm";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function VehicleDetail({ params }) {
  const session = await getSession();
  const v = db.prepare(`SELECT * FROM vehicles WHERE id=?`).get(params.id);
  if (!v) notFound();
  const trips = db.prepare(`SELECT t.*, d.name dName FROM trips t JOIN drivers d ON d.id=t.driverId
    WHERE t.vehicleId=? ORDER BY t.createdAt DESC LIMIT 12`).all(v.id);
  const maint = db.prepare(`SELECT * FROM maintenance_logs WHERE vehicleId=? ORDER BY openedAt DESC`).all(v.id);
  const docs = db.prepare(`SELECT * FROM vehicle_documents WHERE vehicleId=? ORDER BY uploadedAt DESC`).all(v.id);
  const fuel = db.prepare(`SELECT COALESCE(SUM(cost),0) c, COALESCE(SUM(liters),0) l FROM fuel_logs WHERE vehicleId=?`).get(v.id);
  const maintCost = maint.reduce((s, m) => s + m.cost, 0);
  const canManage = ["ADMIN", "FLEET_MANAGER"].includes(session.role);
  const now = new Date().toISOString();

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <Link href="/vehicles" className="text-[12.5px] font-semibold" style={{ color: "var(--gold)" }}>← All vehicles</Link>
        <div className="flex justify-between items-end flex-wrap gap-3 mt-2">
          <div>
            <h2 className="font-display text-2xl font-bold">{v.name} <span className="font-normal text-base" style={{ color: "var(--mid)" }}>· {v.registrationNumber}</span></h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--mid)" }}>{v.model} · {v.type} · capacity {v.maxLoadKg.toLocaleString("en-IN")} kg · {v.odometerKm.toLocaleString("en-IN")} km on the clock</p>
          </div>
          <StatusBadge status={v.status} />
        </div>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { t: "Operational cost", val: `₹${(fuel.c + maintCost).toLocaleString("en-IN")}`, s: `⛽ ₹${fuel.c.toLocaleString("en-IN")} · 🔧 ₹${maintCost.toLocaleString("en-IN")}` },
          { t: "Fuel consumed", val: `${fuel.l.toFixed(1)} L`, s: "lifetime logged" },
          { t: "Acquisition cost", val: `₹${v.acquisitionCost.toLocaleString("en-IN")}`, s: "basis for ROI" },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 70}>
            <div className="glass-navy sheen p-5 rounded-2xl">
              <p className="text-[11px] uppercase tracking-[2px]" style={{ color: "var(--low)" }}>{c.t}</p>
              <p className="font-display text-[24px] font-bold mt-1.5" style={{ color: "var(--gold)" }}>{c.val}</p>
              <p className="text-[11.5px]" style={{ color: "var(--mid)" }}>{c.s}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* documents */}
      <Reveal delay={140}>
        <div className="glass p-5">
          <h3 className="font-display font-semibold text-[15px] mb-1">📁 Documents</h3>
          <p className="text-[12px] mb-4" style={{ color: "var(--low)" }}>RC book, insurance, permits — stored per vehicle with expiry tracking.</p>
          {canManage && (
            <ActionForm action={uploadDocument} submitLabel="Upload" small className="grid md:grid-cols-4 gap-3 mb-4 items-end">
              <input type="hidden" name="vehicleId" value={v.id} />
              <div className="field"><label>Type</label>
                <select className="input" name="docType">{["RC Book", "Insurance", "Permit", "PUC", "Other"].map((d) => <option key={d}>{d}</option>)}</select></div>
              <div className="field"><label>File (max 8 MB)</label><input className="input !py-2" type="file" name="file" required /></div>
              <div className="field"><label>Expiry (optional)</label><input className="input" type="date" name="expiryDate" /></div>
            </ActionForm>
          )}
          <div className="flex flex-col gap-2">
            {docs.length === 0 && <p className="text-[13px]" style={{ color: "var(--mid)" }}>No documents uploaded yet.</p>}
            {docs.map((d) => {
              const expired = d.expiryDate && d.expiryDate <= now;
              return (
                <div key={d.id} className="flex justify-between items-center px-4 py-3 rounded-xl flex-wrap gap-2" style={{ background: "rgba(228,214,189,.03)" }}>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-gold">{d.docType.toUpperCase()}</span>
                    <a href={`/api/docs/${d.id}`} target="_blank" className="text-[13.5px] font-semibold hover:underline">{d.fileName}</a>
                    {d.expiryDate && (
                      <span className="text-[12px]" style={{ color: expired ? "#CE7B6E" : "var(--mid)" }}>
                        {expired ? "🚫 expired " : "valid till "}{d.expiryDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <ActionForm action={deleteDocument} submitLabel="Remove" danger small confirmText={`Delete ${d.fileName}?`}>
                      <input type="hidden" name="id" value={d.id} />
                    </ActionForm>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-4">
        <Reveal delay={200}>
          <div className="glass p-5 h-full">
            <h3 className="font-display font-semibold text-[15px] mb-4">🗺 Trip history</h3>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-auto pr-1">
              {trips.length === 0 && <p className="text-[13px]" style={{ color: "var(--mid)" }}>No trips yet.</p>}
              {trips.map((t) => (
                <div key={t.id} className="flex justify-between items-center px-3.5 py-2.5 rounded-lg text-[13px]" style={{ background: "rgba(228,214,189,.03)" }}>
                  <span>{t.source} → {t.destination} · {t.dName}{t.revenue > 0 && <span style={{ color: "#7FBF9E" }}> · ₹{t.revenue.toLocaleString("en-IN")}</span>}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={260}>
          <div className="glass p-5 h-full">
            <h3 className="font-display font-semibold text-[15px] mb-4">🔧 Maintenance history</h3>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-auto pr-1">
              {maint.length === 0 && <p className="text-[13px]" style={{ color: "var(--mid)" }}>No maintenance records.</p>}
              {maint.map((m) => (
                <div key={m.id} className="flex justify-between items-center px-3.5 py-2.5 rounded-lg text-[13px]" style={{ background: "rgba(228,214,189,.03)" }}>
                  <span>{m.description} · ₹{m.cost.toLocaleString("en-IN")} · {m.openedAt.slice(0, 10)}</span>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
