"use client";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/roles";

export default function Topbar({ session, alerts, healthPill }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="font-display text-[23px] font-semibold tracking-tight">
          Fleet command, <em className="font-script not-italic" style={{ color: "var(--gold)", fontStyle: "italic" }}>live from the road</em>
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--low)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · signed in as {ROLE_LABELS[session.role]}
        </p>
      </div>
      <div className="flex items-center gap-3 relative">
        {healthPill}
        {/* notifications */}
        <button onClick={() => { setOpen(!open); setMenu(false); }}
          className="btn relative" title="License alerts">
          🔔
          {alerts.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold"
              style={{ background: "linear-gradient(135deg,#E8B44A,#C99530)", color: "#171004" }}>
              {alerts.length}
            </span>
          )}
        </button>
        {open && (
          <div className="glass absolute right-0 top-12 w-[340px] p-3 z-50">
            <p className="text-[10.5px] uppercase tracking-[2px] px-2 pb-2" style={{ color: "var(--low)" }}>License alerts (30 days)</p>
            {alerts.length === 0 && <p className="text-sm px-2 pb-2" style={{ color: "var(--mid)" }}>All licenses healthy ✓</p>}
            {alerts.map((a) => (
              <div key={a.id} className="px-2 py-2.5 rounded-lg text-[13px] flex justify-between items-center gap-2"
                style={{ borderBottom: "1px solid rgba(228,214,189,.06)" }}>
                <span>{a.expired ? "🚫" : "⚠️"} <b>{a.name}</b></span>
                <span style={{ color: a.expired ? "#CE7B6E" : "#D9A46B" }}>
                  {a.expired ? `expired ${-a.daysLeft}d ago` : `${a.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* user menu */}
        <button onClick={() => { setMenu(!menu); setOpen(false); }}
          className="w-9 h-9 rounded-full grid place-items-center font-bold text-[13px]"
          style={{ background: "linear-gradient(135deg,#7EA6D9,#0D1B33)", boxShadow: "0 0 14px rgba(126,166,217,.3)" }}>
          {session.name[0]?.toUpperCase()}
        </button>
        {menu && (
          <div className="glass absolute right-0 top-12 w-[230px] p-4 z-50">
            <p className="font-semibold text-sm">{session.name}</p>
            <p className="text-[12px] mb-3" style={{ color: "var(--mid)" }}>{session.email}</p>
            <span className="badge badge-gold mb-3"><span className="dot" />{ROLE_LABELS[session.role]}</span>
            <form action={logoutAction} className="mt-3">
              <button className="btn btn-danger w-full justify-center">Log out</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
