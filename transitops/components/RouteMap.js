// Cartographic fleet tracker — designed to look like a real logistics dashboard
// (Samsara / Fleetio / Uber Fleet). No emojis on the map. No decorative flourishes.
// Real Gujarat state polygon derived from geographic coordinates, projected here.

// Geographic anchors for the projection (approx WGS84 → pixel space)
// Frame: lon 68.5–74.5, lat 20–25 → 640×480 canvas
const project = (lon, lat) => [
  ((lon - 68.5) / 6) * 640,
  ((25 - lat) / 5) * 480,
];

// Realistic Gujarat state boundary (simplified from Natural Earth data)
const GUJARAT_OUTLINE = [
  [68.8, 24.7], [69.5, 24.4], [70.5, 24.3], [71.5, 24.7], [72.2, 24.6],
  [73.0, 24.4], [73.6, 24.0], [74.0, 23.5], [74.2, 22.8], [74.3, 22.2],
  [74.0, 21.7], [73.5, 21.3], [73.1, 20.9], [72.9, 20.4], [72.7, 20.6],
  [72.6, 21.2], [72.4, 21.5], [72.2, 21.7], [72.7, 21.9], [72.5, 22.1],
  [72.0, 21.8], [71.5, 21.1], [71.0, 20.8], [70.7, 20.7], [70.3, 21.0],
  [69.8, 21.2], [69.4, 21.5], [69.0, 21.7], [68.8, 22.0], [69.0, 22.4],
  [69.5, 22.6], [70.0, 22.8], [70.3, 23.2], [69.9, 23.4], [69.4, 23.5],
  [68.9, 23.7], [68.7, 24.0], [68.8, 24.7],
];

// Kutch inlet + Gulf of Khambhat (water bodies)
const KHAMBHAT = [[72.5, 21.9], [72.7, 22.3], [72.6, 22.6], [72.4, 22.3], [72.5, 21.9]];

const CITIES = [
  { name: "Ahmedabad", lon: 72.58, lat: 23.03, pop: 3, code: "AMD" },
  { name: "Vadodara",  lon: 73.19, lat: 22.31, pop: 3, code: "BDQ" },
  { name: "Surat",     lon: 72.83, lat: 21.17, pop: 3, code: "STV" },
  { name: "Rajkot",    lon: 70.80, lat: 22.30, pop: 3, code: "RAJ" },
  { name: "Bhavnagar", lon: 72.15, lat: 21.76, pop: 2, code: "BHU" },
  { name: "Jamnagar",  lon: 70.07, lat: 22.47, pop: 2, code: "JGA" },
  { name: "Junagadh",  lon: 70.46, lat: 21.52, pop: 2, code: "JND" },
  { name: "Anand",     lon: 72.96, lat: 22.56, pop: 1 },
  { name: "Nadiad",    lon: 72.86, lat: 22.69, pop: 1 },
  { name: "Bharuch",   lon: 72.99, lat: 21.71, pop: 2, code: "BHR" },
  { name: "Ankleshwar",lon: 73.00, lat: 21.63, pop: 1 },
  { name: "Gandhinagar",lon: 72.65, lat: 23.22, pop: 2, code: "GNR" },
  { name: "Mehsana",   lon: 72.37, lat: 23.60, pop: 1 },
  { name: "Porbandar", lon: 69.61, lat: 21.64, pop: 1 },
  { name: "Mumbai",    lon: 72.87, lat: 19.08, pop: 3, code: "BOM" },
];

// Main National Highways / expressways (approximate, realistic corridors)
const HIGHWAYS = [
  // NH-48 Delhi–Mumbai spine through Ahmedabad-Vadodara-Surat
  { name: "NH-48", pts: [[72.65, 23.22], [72.58, 23.03], [72.96, 22.56], [73.19, 22.31], [72.99, 21.71], [72.83, 21.17], [72.87, 19.08]] },
  // Saurashtra ring: Ahmedabad-Rajkot-Jamnagar
  { name: "NH-27", pts: [[72.58, 23.03], [70.80, 22.30], [70.07, 22.47]] },
  // Rajkot to Junagadh / Porbandar
  { name: "NH-27B", pts: [[70.80, 22.30], [70.46, 21.52], [69.61, 21.64]] },
  // Bhavnagar spur
  { name: "SH", pts: [[72.58, 23.03], [72.15, 21.76]] },
];

const findCity = (name) => CITIES.find((c) => c.name === name);

// smooth curve through a set of points
const pathThrough = (pts) => {
  const P = pts.map(([lon, lat]) => project(lon, lat));
  if (P.length < 2) return "";
  let d = `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 1; i < P.length; i++) {
    const prev = P[i - 1], cur = P[i];
    const mx = (prev[0] + cur[0]) / 2, my = (prev[1] + cur[1]) / 2;
    d += ` Q ${prev[0].toFixed(1)} ${prev[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += ` T ${P[P.length - 1][0].toFixed(1)} ${P[P.length - 1][1].toFixed(1)}`;
  return d;
};

const straightArc = (a, b) => {
  const [ax, ay] = project(a.lon, a.lat), [bx, by] = project(b.lon, b.lat);
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const dx = bx - ax, dy = by - ay;
  const nx = -dy * 0.12, ny = dx * 0.12;
  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
};

const distKm = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
};

export default function RouteMap({ activeTrips, recentTrips }) {
  const active = activeTrips
    .map((t) => {
      const from = findCity(t.source), to = findCity(t.destination);
      if (!from || !to) return null;
      return { ...t, from, to, km: distKm(from, to) };
    })
    .filter(Boolean)
    .slice(0, 4);

  const ghosts = recentTrips
    .filter((t) => t.status === "Completed")
    .slice(0, 6)
    .map((t) => ({ id: t.id, from: findCity(t.source), to: findCity(t.destination) }))
    .filter((r) => r.from && r.to);

  const activeCityNames = new Set(active.flatMap((r) => [r.source, r.destination]));

  const outlinePath = "M " + GUJARAT_OUTLINE.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(" ")).join(" L ") + " Z";
  const khambhatPath = "M " + KHAMBHAT.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(" ")).join(" L ") + " Z";

  return (
    <div className="glass p-6 h-full relative overflow-hidden">
      {/* header bar — telemetry-style */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[2.4px] uppercase mb-1" style={{ color: "var(--gold)" }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: "#7FBF9E", boxShadow: "0 0 8px #7FBF9E", animation: "pl 1.4s infinite" }} />
            LIVE TELEMETRY · GUJARAT
          </div>
          <h3 className="font-display font-semibold text-[15.5px]">Active fleet corridor</h3>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="font-display text-[22px] font-bold leading-none" style={{ color: "var(--gold)" }}>{active.length}</div>
            <div className="text-[9.5px] tracking-[1.8px] uppercase mt-1" style={{ color: "var(--low)" }}>rolling</div>
          </div>
          <div>
            <div className="font-display text-[22px] font-bold leading-none">{CITIES.length}</div>
            <div className="text-[9.5px] tracking-[1.8px] uppercase mt-1" style={{ color: "var(--low)" }}>nodes</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_200px] gap-4">
        {/* the map */}
        <div className="relative rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #050912 0%, #030509 100%)",
            border: "1px solid var(--line)",
          }}>
          <svg viewBox="0 0 640 480" className="w-full h-auto block">
            <defs>
              {/* land */}
              <linearGradient id="landFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0E1B2E" />
                <stop offset="100%" stopColor="#08111F" />
              </linearGradient>
              <linearGradient id="landStroke" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(228,214,189,.32)" />
                <stop offset="100%" stopColor="rgba(228,214,189,.14)" />
              </linearGradient>
              {/* water */}
              <linearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#050912" />
                <stop offset="100%" stopColor="#020509" />
              </linearGradient>
              {/* subtle bathymetry lines */}
              <pattern id="bathy" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 0 15 Q 7.5 12, 15 15 T 30 15" stroke="rgba(126,166,217,.06)" fill="none" strokeWidth="0.4" />
                <path d="M 0 22 Q 7.5 19, 15 22 T 30 22" stroke="rgba(126,166,217,.04)" fill="none" strokeWidth="0.4" />
              </pattern>
              {/* highway styling — dual-line highway effect */}
              <linearGradient id="highway" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(232,180,74,.4)" />
                <stop offset="100%" stopColor="rgba(232,180,74,.15)" />
              </linearGradient>
              <filter id="softGlow"><feGaussianBlur stdDeviation="0.5" /></filter>
              <filter id="cityGlow"><feGaussianBlur stdDeviation="4" /></filter>
              <radialGradient id="activePulse" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(126,166,217,.8)" />
                <stop offset="70%" stopColor="rgba(126,166,217,.1)" />
                <stop offset="100%" stopColor="rgba(126,166,217,0)" />
              </radialGradient>
            </defs>

            {/* water base with subtle bathymetry */}
            <rect x="0" y="0" width="640" height="480" fill="url(#water)" />
            <rect x="0" y="0" width="640" height="480" fill="url(#bathy)" />

            {/* graticule / lat-lon reference grid */}
            <g stroke="rgba(228,214,189,.045)" strokeWidth="0.4">
              {[21, 22, 23, 24].map((lat) => (
                <line key={"lat" + lat} x1="0" y1={project(0, lat)[1]} x2="640" y2={project(0, lat)[1]} strokeDasharray="1 6" />
              ))}
              {[69, 70, 71, 72, 73, 74].map((lon) => (
                <line key={"lon" + lon} x1={project(lon, 0)[0]} y1="0" x2={project(lon, 0)[0]} y2="480" strokeDasharray="1 6" />
              ))}
            </g>
            {/* graticule labels */}
            <g fill="rgba(228,214,189,.22)" fontFamily="'Space Grotesk', sans-serif" fontSize="7.5" fontWeight="500">
              {[22, 23, 24].map((lat) => (
                <text key={"latt" + lat} x="4" y={project(0, lat)[1] - 3}>{lat}°N</text>
              ))}
              {[70, 72, 74].map((lon) => (
                <text key={"lont" + lon} x={project(lon, 0)[0] + 3} y="10">{lon}°E</text>
              ))}
            </g>

            {/* land polygon — Gujarat */}
            <path d={outlinePath} fill="url(#landFill)" stroke="url(#landStroke)" strokeWidth="1" strokeLinejoin="round" />
            {/* land highlight strip along the coast */}
            <path d={outlinePath} fill="none" stroke="rgba(126,166,217,.18)" strokeWidth="2" strokeLinejoin="round" filter="url(#softGlow)" opacity="0.6" />
            {/* Gulf of Khambhat — water indent */}
            <path d={khambhatPath} fill="#050912" stroke="rgba(126,166,217,.15)" strokeWidth="0.5" />

            {/* highway network (rendered under everything else) */}
            {HIGHWAYS.map((h, i) => (
              <g key={"hw" + i}>
                <path d={pathThrough(h.pts)} fill="none" stroke="rgba(228,214,189,.28)" strokeWidth="1.6" strokeLinecap="round" />
                <path d={pathThrough(h.pts)} fill="none" stroke="rgba(228,214,189,.6)" strokeWidth="0.6" strokeLinecap="round" strokeDasharray="4 4" />
              </g>
            ))}

            {/* ghost routes (completed trips) — faint history */}
            {ghosts.map((r) => (
              <path key={r.id} d={straightArc(r.from, r.to)} fill="none" stroke="rgba(228,214,189,.1)" strokeWidth="0.8" strokeDasharray="1 4" />
            ))}

            {/* active routes with animated flow */}
            {active.map((r, i) => (
              <g key={"rt" + r.id}>
                <path d={straightArc(r.from, r.to)} fill="none" stroke="rgba(232,180,74,.4)" strokeWidth="5" filter="url(#cityGlow)" opacity="0.5" />
                <path id={`rt-${i}`} d={straightArc(r.from, r.to)} fill="none"
                  stroke="#E8B44A" strokeWidth="1.8" strokeLinecap="round"
                  strokeDasharray="6 7"
                  style={{ animation: `flowmap ${1.4 + i * 0.15}s linear infinite` }} />
              </g>
            ))}

            {/* cities */}
            {CITIES.map((c) => {
              const [x, y] = project(c.lon, c.lat);
              const isActive = activeCityNames.has(c.name);
              const r = c.pop === 3 ? 3.5 : c.pop === 2 ? 2.5 : 1.8;
              const stroke = c.pop === 3 ? "#F2EDE2" : "rgba(228,214,189,.7)";
              const fill = isActive ? "#7EA6D9" : c.pop === 3 ? "#E8B44A" : c.pop === 2 ? "#E4D6BD" : "#A9A08E";
              return (
                <g key={c.name}>
                  {/* active pulse ring */}
                  {isActive && (
                    <circle cx={x} cy={y} r="12" fill="url(#activePulse)">
                      <animate attributeName="r" values="8;22;8" dur="2.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0;1" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* city marker */}
                  <circle cx={x} cy={y} r={r + 1} fill="#050912" />
                  <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={c.pop === 3 ? 0.9 : 0.6} />
                  {/* label with IATA-like code for tier 1 & 2 */}
                  <g fontFamily="'Space Grotesk', sans-serif">
                    <text
                      x={x + r + 4}
                      y={y + 3}
                      fontSize={c.pop === 3 ? 10 : c.pop === 2 ? 9 : 8}
                      fontWeight={c.pop === 3 ? 700 : c.pop === 2 ? 600 : 500}
                      letterSpacing={c.pop === 3 ? "0.5" : "0.3"}
                      fill={isActive ? "#F2EDE2" : c.pop === 3 ? "#E4D6BD" : c.pop === 2 ? "rgba(228,214,189,.75)" : "rgba(169,160,142,.7)"}>
                      {c.name.toUpperCase()}
                    </text>
                    {c.code && (
                      <text
                        x={x + r + 4}
                        y={y + 13}
                        fontSize="7"
                        letterSpacing="1"
                        fill="rgba(232,180,74,.55)"
                        fontWeight="600">
                        {c.code}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}

            {/* vehicle markers — no emoji, a real fleet-tracker dot */}
            {active.map((r, i) => (
              <g key={"veh" + r.id}>
                {/* leader glow */}
                <circle r="6" fill="rgba(232,180,74,.35)" filter="url(#softGlow)">
                  <animateMotion dur={`${8 + i * 1.2}s`} repeatCount="indefinite" rotate="0">
                    <mpath href={`#rt-${i}`} />
                  </animateMotion>
                </circle>
                {/* inner marker */}
                <circle r="3.2" fill="#E8B44A" stroke="#F2EDE2" strokeWidth="0.8">
                  <animateMotion dur={`${8 + i * 1.2}s`} repeatCount="indefinite" rotate="0">
                    <mpath href={`#rt-${i}`} />
                  </animateMotion>
                </circle>
              </g>
            ))}

            {/* scale bar */}
            <g transform="translate(20, 460)">
              <rect x="0" y="-3" width="60" height="6" fill="none" stroke="rgba(228,214,189,.35)" strokeWidth="0.6" />
              <rect x="0" y="-3" width="30" height="6" fill="rgba(228,214,189,.25)" />
              <text x="0" y="14" fontSize="7.5" fill="rgba(228,214,189,.55)" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.8">0</text>
              <text x="26" y="14" fontSize="7.5" fill="rgba(228,214,189,.55)" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.8">50</text>
              <text x="52" y="14" fontSize="7.5" fill="rgba(228,214,189,.55)" fontFamily="'Space Grotesk',sans-serif" letterSpacing="0.8">100 KM</text>
            </g>

            {/* north indicator (simple, tasteful) */}
            <g transform="translate(600, 40)">
              <line x1="0" y1="-14" x2="0" y2="14" stroke="rgba(228,214,189,.35)" strokeWidth="0.7" />
              <path d="M 0 -14 L 3 -8 L -3 -8 Z" fill="rgba(232,180,74,.85)" />
              <text y="-18" textAnchor="middle" fontSize="9" fill="rgba(232,180,74,.85)" fontFamily="'Space Grotesk',sans-serif" fontWeight="700">N</text>
            </g>

            {/* corner tick — projection reference */}
            <text x="636" y="474" fontSize="7" fill="rgba(228,214,189,.3)" fontFamily="'Space Grotesk',sans-serif" textAnchor="end" letterSpacing="1">
              PROJ · WGS84 · TRANSITOPS/OPS
            </text>
          </svg>

          {/* HUD readout overlay top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 text-[9px] tracking-[1.4px] uppercase font-mono"
            style={{ color: "rgba(228,214,189,.55)" }}>
            <div>LAT 20.0°N — 25.0°N</div>
            <div>LON 68.5°E — 74.5°E</div>
          </div>
        </div>

        {/* right rail — vehicle telemetry (this is what makes it look like a fleet tracker) */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] uppercase tracking-[2.2px] px-1 flex justify-between" style={{ color: "var(--low)" }}>
            <span>vehicles</span><span>eta</span>
          </div>
          {active.length === 0 && (
            <div className="rounded-lg px-3 py-8 text-[11px] text-center"
              style={{ background: "rgba(228,214,189,.02)", border: "1px solid var(--line)", color: "var(--low)" }}>
              No active vehicles<br/><span style={{ fontSize: 9, letterSpacing: 1.2 }}>FLEET AT REST</span>
            </div>
          )}
          {active.map((r, i) => {
            const eta = Math.round((r.km / 55) * 60);
            const load = Math.min(100, Math.round((r.cargoWeightKg / r.vCap) * 100));
            return (
              <div key={"tel" + r.id} className="rounded-lg px-3 py-2.5 relative"
                style={{ background: "linear-gradient(150deg,rgba(13,27,51,.5),rgba(6,10,20,.7))", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[11px] font-bold tracking-[0.6px]" style={{ color: "var(--beige)" }}>{r.vName}</span>
                  <span className="text-[8.5px] font-mono tracking-[1px]" style={{ color: "#7EA6D9" }}>● ACTIVE</span>
                </div>
                <div className="text-[9.5px] mt-1 font-mono truncate" style={{ color: "var(--mid)" }}>
                  {r.source.slice(0, 3).toUpperCase()} → {r.destination.slice(0, 3).toUpperCase()}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-[15px] font-bold" style={{ color: "var(--gold)" }}>{r.km}</span>
                    <span className="text-[8.5px] tracking-[1.4px]" style={{ color: "var(--low)" }}>KM</span>
                  </div>
                  <div className="text-[9.5px] font-mono" style={{ color: "var(--mid)" }}>ETA {eta}m</div>
                </div>
                {/* progress bar with clean labels */}
                <div className="h-[2px] mt-1.5 rounded-full overflow-hidden" style={{ background: "rgba(228,214,189,.08)" }}>
                  <div className="h-full"
                    style={{
                      background: "linear-gradient(90deg,var(--gold),#FF8A3C)",
                      animation: `progressPulse ${8 + i * 1.2}s linear infinite`,
                    }} />
                </div>
                <div className="text-[8.5px] font-mono mt-1.5" style={{ color: "var(--low)" }}>
                  LOAD {load}% · {r.cargoWeightKg}KG
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes flowmap { to { stroke-dashoffset: -13; } }
        @keyframes progressPulse { 0% { width: 6%; } 100% { width: 100%; } }
      `}</style>
    </div>
  );
}
