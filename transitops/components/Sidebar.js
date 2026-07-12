"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/vehicles", label: "Vehicles", icon: "🚚" },
  { href: "/drivers", label: "Drivers", icon: "👤" },
  { href: "/trips", label: "Trips", icon: "🗺" },
  { href: "/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/expenses", label: "Fuel & Expenses", icon: "⛽" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/rules", label: "Business Rules", icon: "🛡" },
  { href: "/users", label: "Users", icon: "🛡", admin: true },
];

export default function Sidebar({ role }) {
  const path = usePathname();
  return (
    <aside className="glass sheen w-[248px] shrink-0 p-4 flex flex-col gap-1 sticky top-6 self-start max-h-[calc(100vh-48px)]">
      <div className="flex items-center gap-3 px-2 pb-5 pt-1">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-lg"
          style={{ background: "linear-gradient(135deg,#E8B44A,#C99530)", boxShadow: "0 0 20px rgba(232,180,74,.4)" }}>🚛</div>
        <div className="font-display font-bold text-[17px] tracking-tight">TransitOps</div>
      </div>
      {LINKS.filter((l) => !l.admin || role === "ADMIN").map((l) => (
        <Link key={l.href} href={l.href}
          className={`navlink ${path === l.href ? "active" : ""}`}>
          <span className="w-5 text-center">{l.icon}</span>{l.label}
        </Link>
      ))}
      <div className="mt-auto mx-1 mb-1 rounded-xl px-3.5 py-3 text-[11.5px] leading-relaxed"
        style={{ background: "rgba(232,180,74,.05)", border: "1px solid rgba(232,180,74,.18)", color: "var(--mid)" }}>
        <b style={{ color: "var(--gold)" }}>Rules enforced live</b><br />
        Invalid dispatches are impossible by design.
      </div>
    </aside>
  );
}
