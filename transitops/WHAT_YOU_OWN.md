# 👑 Hirva — Team Lead & Design (hirva folder)

## Your files (24 total)

### Project scaffold — commit FIRST
- `package.json`, `next.config.mjs`, `tailwind.config.mjs`, `postcss.config.mjs`, `jsconfig.json`, `.gitignore`, `README.md`

### Design system + app shell
- `app/globals.css` — glass, sheen, badges, truck loader, background, toasts
- `app/layout.js` — root layout + fonts + background layers
- `app/(dash)/layout.js` — protected dashboard shell (sidebar + topbar)
- `app/(dash)/loading.js` — the truck road-loader as a loading state
- `app/(dash)/page.js` — **THE DASHBOARD** (KPIs, RouteMap, RulesStrip, weekly chart, live fleet)

### Reusable components
- `components/Sidebar.js` — role-aware nav with Business Rules link
- `components/Topbar.js` — notifications, user menu, logout, health pill mount
- `components/HealthPill.js` — "16/16 rules verified · N vehicles · N drivers · N trips"
- `components/RouteMap.js` — **CARTOGRAPHIC GUJARAT FLEET MAP** (real coordinates, WGS84 projection)
- `components/RulesStrip.js` — live rules-firing counters
- `components/TruckLoader.js` — signature loading component
- `components/StatusBadge.js` — one source of truth for status colors
- `components/Reveal.js` — scroll-triggered fade-in wrapper
- `components/TiltCard.js` — 3D perspective tilt on mousemove
- `components/CountUp.js` — animated number reveals
- `components/ActionForm.js` — server-action wrapper with toasts

## If a judge asks "how does the map work?"
> The Gujarat outline uses real longitude/latitude coordinates projected onto the canvas
> with a WGS84 → pixel transform. Cities are placed by real coordinates (Ahmedabad at
> 72.58°E 23.03°N, Vadodara at 73.19°E 22.31°N). Distances use the Haversine formula.
> Trucks moving along the routes are the actual currently-dispatched trips from the DB.

## Commit style — spread across the morning
- `chore: project scaffold`
- `feat: design system + theme tokens`
- `feat: protected dashboard shell`
- `feat(components): shared design atoms`
- `feat(sidebar): role-aware navigation`
- `feat(topbar): notifications + health pill`
- `feat(dashboard): KPIs and live fleet`
- `feat(dashboard): rules-firing counters strip`
- `feat(dashboard): cartographic Gujarat fleet map`
