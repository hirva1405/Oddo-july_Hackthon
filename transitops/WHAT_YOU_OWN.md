# 📊 KD — Module Pages & Reports (kd folder)

## Your files (8 total)

### Vehicles
- `app/(dash)/vehicles/page.js` — registry with search / filter / sort, register + retire
- `app/(dash)/vehicles/[id]/page.js` — vehicle detail: stats, document vault, trip + maintenance history

### Drivers
- `app/(dash)/drivers/page.js` — table with license-expiry warnings, safety scores, status control

### Fuel & Expenses
- `app/(dash)/expenses/page.js` — fuel logs + expenses + auto-computed cost per vehicle

### Reports & Analytics
- `app/(dash)/reports/page.js` — top-3 highlight cards, cost chart, full table, CSV + PDF export

### Admin
- `app/(dash)/users/page.js` — admin-only page to promote user roles

### Business Rules showcase
- `app/(dash)/rules/page.js` — **THE 10 RULES PAGE** with "16 passed · 0 failed" badge

### PDF export
- `components/PdfButton.js` — styled landscape PDF via jsPDF + autotable

## If a judge asks "how does search/filter work?"
> Pages read `searchParams` from the URL — e.g. `/vehicles?q=van&status=Available`.
> The server-side query builds SQL dynamically. No client-side JavaScript needed —
> it's all server-rendered Next.js.

## If a judge asks about reports formulas
> Fuel efficiency = distance ÷ fuel (km/L).
> Operational cost = fuel cost + maintenance cost.
> ROI = (Revenue − Operational Cost) ÷ Acquisition Cost × 100.
> Revenue is captured when a trip is Completed.

## Commit style — spread across the morning
- `feat(vehicles): registry with search and filters`
- `feat(vehicles): detail page with document vault`
- `feat(drivers): table with license warnings`
- `feat(expenses): fuel logs and cost breakdown`
- `feat(reports): analytics dashboard with CSV export`
- `feat(reports): styled PDF export`
- `feat(users): admin role management`
- `feat(rules): business rules showcase page`
