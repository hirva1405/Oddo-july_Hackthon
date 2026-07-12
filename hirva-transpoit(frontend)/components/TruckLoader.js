export default function TruckLoader({ label = "Loading fleet data…" }) {
  return (
    <div className="w-full max-w-xl mx-auto py-10">
      <div className="lane"><div className="lane-dash" /><div className="lane-truck">🚛</div></div>
      <p className="text-center text-[11px] tracking-[2.2px] uppercase mt-3" style={{ color: "var(--low)" }}>{label}</p>
    </div>
  );
}
