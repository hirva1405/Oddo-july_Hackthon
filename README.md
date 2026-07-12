# 🚛 TransitOps — Smart Transport Operations Platform

> A centralized fleet command center that digitizes vehicle, driver, dispatch, maintenance, and expense management — with hard-enforced business rules, RBAC, and a cinematic dark UI in black, navy, beige & gold.

**🎥 Demo Video:** _[link — add before submission]_

---

## 🚀 Run it (3 commands)

```bash
npm install
npm run seed
npm run dev        # → http://localhost:3000
```

### 🔑 Demo logins (password: `demo1234`)

| Role | Email |
|------|-------|
| Admin | admin@transitops.com |
| Fleet Manager | manager@transitops.com |
| Driver | driver@transitops.com |
| Safety Officer | safety@transitops.com |
| Financial Analyst | finance@transitops.com |

New signups start as **Driver**; the Admin promotes roles from the **Users** page (realistic, non-self-elevating account creation).

---

## 🛡️ All 10 Mandatory Business Rules — enforced & tested

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Unique vehicle registration number | SQL `UNIQUE` constraint + friendly error |
| 2 | Retired / In-Shop vehicles never in dispatch selection | Filtered eligibility query |
| 3 | Expired-license / Suspended drivers can't be assigned | Server-side validation + filtered pool |
| 4 | No double-assignment of On-Trip vehicle/driver | Transactional status check |
| 5 | Cargo weight ≤ vehicle max capacity | Validated at create **and** dispatch |
| 6 | Dispatch ⇒ vehicle & driver → On Trip | Atomic SQL transaction |
| 7 | Complete ⇒ both → Available (+ odometer & fuel log) | Atomic SQL transaction |
| 8 | Cancel dispatched ⇒ both restored | Atomic SQL transaction |
| 9 | Open maintenance ⇒ vehicle → In Shop, hidden from dispatch | Atomic SQL transaction |
| 10 | Close maintenance ⇒ vehicle → Available (unless Retired) | Atomic SQL transaction |

**Proof:** `node scripts/test-rules.mjs` runs a 16-test suite against the live database — including an atomicity test that sabotages a dispatch mid-flow and verifies nothing is left half-flipped. **16/16 passing.**

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + React 18, JavaScript |
| Database | **SQLite via better-sqlite3 — hand-written SQL schema & queries** |
| Transactions | Native SQL transactions (`db.transaction`) for every status flip |
| Auth | JWT sessions (jose) in httpOnly cookies + bcrypt hashing |
| RBAC | 5 roles enforced in middleware + every server action |
| Styling | Tailwind CSS + custom design system (glassmorphism, gold/navy/beige) |
| Animations | CSS keyframes + IntersectionObserver reveals, 3D tilt cards, count-ups |
| Exports | CSV via streaming route handler |

No ORM, no external services, no env vars needed — clone, install, run.

---

## ✨ Features

- **Auth & RBAC** — login/register/logout, protected routes, role-aware navigation, admin role promotion
- **Dashboard** — 7 live KPIs (animated count-up 3D tilt cards), weekly cost chart, live fleet board, scrolling activity ticker
- **Vehicle Registry** — search/filter by name/reg/status/type, register, retire, unique-reg enforcement
- **Driver Management** — license expiry warnings (🚫 expired / ⚠️ <30 days), safety scores, status control
- **Trip Management** — full lifecycle with filtered eligible pools, live rule validation with toast errors, revenue capture at completion
- **Maintenance** — open → In Shop (auto-hidden from dispatch), close → restored
- **Fuel & Expenses** — logs + auto-computed operational cost per vehicle
- **Reports** — fuel efficiency (km/L), fleet utilization, operational cost chart, **ROI = (Revenue − (Maintenance+Fuel)) / Acquisition Cost**, CSV export
- **License notifications** — 🔔 bell with expiring-license alerts
- **Signature UX** — animated truck road-loader on every page load, ornamental living background, dark theme by design

## 🌟 Bonus features implemented
✅ Charts & visual analytics · ✅ Dark mode (native) · ✅ Search, filters & sorting · ✅ In-app license expiry reminders · ✅ **PDF export** (styled fleet report) · ✅ **Vehicle document management** (RC/insurance/permit upload with expiry tracking)

---

## 🏗️ Architecture

```
app/
├── login/ · register/        # auth screens
├── (dash)/                   # protected shell: sidebar, topbar, truck loader
│   ├── page.js               # dashboard
│   ├── vehicles/ drivers/ trips/ maintenance/ expenses/ reports/ users/
├── api/reports/csv/          # CSV export
lib/
├── db.js                     # SQLite + full SQL schema (auto-creates)
├── services.js               # ⭐ ALL business rules, atomic transactions
├── analytics.js              # KPIs, reports math, license alerts
├── auth.js · roles.js        # sessions + RBAC
└── actions/                  # server actions (auth, fleet)
scripts/
├── seed.js · schema.sql      # rich demo data
└── test-rules.mjs            # 16-test business-rule suite
middleware.js                 # route protection
```

**Design principle:** UI never mutates state directly — every status change goes through `lib/services.js`, which validates and updates all affected rows in a single SQL transaction.

---

## 👥 Team

| Member | Role |
|--------|------|
| **Hirva** | Team Lead — Architecture, Data Model, Integration, Design Direction, Demo |
| **Oggy** | Backend — Business Rules Engine, Trip & Maintenance Services |
| **Darshan** | Backend — Authentication, RBAC, Seed Data, Notifications |
| **KD** | Frontend — Dashboard, Module Pages, Tables, Reports |

_Built in 8 hours for the ODD Hackathon 2026 🏁_
