# 🚛 TransitOps — Smart Transport Operations Platform

> A centralized platform that digitizes the complete lifecycle of transport operations — vehicle registration, driver management, trip dispatching, maintenance, fuel & expense tracking, and operational analytics — with hard-enforced business rules and role-based access control.

**🔗 Live Demo:** _[Vercel URL — coming soon]_
**🎥 Demo Video:** _[link — coming soon]_

---

## 📋 Problem Statement

Many logistics companies still rely on spreadsheets and manual logbooks to manage transport operations, leading to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, inaccurate expense tracking, and poor operational visibility.

**TransitOps** solves this with a single source of truth: every vehicle, driver, trip, maintenance job, and expense lives in one system, with automatic status transitions and validations that make invalid operations impossible.

---

## ✨ Key Features

### 🔐 Authentication & RBAC
- Secure email/password login with session management
- Role-Based Access Control — **Fleet Manager**, **Driver**, **Safety Officer**, **Financial Analyst**
- Role-aware navigation and server-side permission enforcement

### 📊 Dashboard
- Live KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization (%)
- Filters by vehicle type, status, and region
- Visual analytics powered by interactive charts

### 🚚 Vehicle Registry
- Complete vehicle master data: unique registration number, model, type, max load capacity, odometer, acquisition cost
- Lifecycle statuses: `Available` · `On Trip` · `In Shop` · `Retired`
- Per-vehicle trip history, operational cost breakdown, and document vault

### 👤 Driver Management
- Driver profiles with license number, category, expiry date, contact, and safety score
- Statuses: `Available` · `On Trip` · `Off Duty` · `Suspended`
- Automatic license-expiry detection — expired drivers are blocked from dispatch

### 🗺️ Trip Management
- Full trip lifecycle: `Draft → Dispatched → Completed / Cancelled`
- Smart selection pools — only eligible vehicles and drivers appear
- Live validation: cargo weight vs. vehicle capacity, license validity, availability

### 🔧 Maintenance Workflow
- Opening a maintenance log automatically moves the vehicle to `In Shop` and removes it from the dispatch pool
- Closing maintenance restores the vehicle to `Available`

### ⛽ Fuel & Expense Tracking
- Fuel logs (liters, cost, date) and general expenses (tolls, repairs…)
- Auto-computed total operational cost (Fuel + Maintenance) per vehicle

### 📈 Reports & Analytics
- Fuel Efficiency (Distance / Fuel), Fleet Utilization, Operational Cost per vehicle
- Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
- One-click **CSV and PDF export**

---

## 🌟 Bonus Features — All 6 Implemented

| Bonus Feature | How |
|---------------|-----|
| 📊 Charts & visual analytics | Interactive Recharts across dashboard & reports |
| 🌙 Dark mode | Full theme system with one-click toggle |
| 🔎 Search, filters & sorting | On every data table (vehicles, drivers, trips…) |
| 📄 PDF export | Report tables exportable as styled PDF |
| 📧 License expiry reminders | In-app notification center + email reminders for licenses expiring within 30 days |
| 📁 Vehicle document management | Upload & manage RC book, insurance, permits per vehicle with expiry tracking |

---

## 🛡️ Enforced Business Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Vehicle registration number must be unique | DB constraint + validation |
| 2 | Retired / In-Shop vehicles never appear in dispatch selection | Filtered eligibility query |
| 3 | Expired-license or Suspended drivers cannot be assigned | Server-side validation |
| 4 | A vehicle/driver already On Trip cannot be double-assigned | Atomic transaction check |
| 5 | Cargo weight must not exceed vehicle max capacity | Zod schema + server check |
| 6 | Dispatch ⇒ vehicle & driver → `On Trip` | Automatic transition |
| 7 | Complete ⇒ vehicle & driver → `Available` | Automatic transition |
| 8 | Cancel (dispatched) ⇒ vehicle & driver restored | Automatic transition |
| 9 | Active maintenance ⇒ vehicle → `In Shop` | Automatic transition |
| 10 | Maintenance closed ⇒ vehicle → `Available` (unless Retired) | Automatic transition |

All status transitions are executed as **atomic database transactions** in a dedicated service layer — statuses can never desync.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | SQL — PostgreSQL (simple relational schema, hosted free on Neon) |
| ORM | Prisma (type-safe queries over plain SQL tables) |
| Authentication | NextAuth.js (credentials + RBAC) |
| Validation | Zod + React Hook Form |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Lucide Icons |
| Charts | Recharts |
| Animations | Framer Motion |
| File Uploads | UploadThing |
| Email | Resend |
| Exports | papaparse (CSV) + jsPDF (PDF) |
| Deployment | Vercel |

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── (auth)/            # login, register
│   └── (dashboard)/       # protected: dashboard, vehicles, drivers,
│                          #   trips, maintenance, expenses, reports
├── lib/
│   ├── services/          # ⭐ ALL business rules & atomic status
│   │                      #   transitions live here
│   ├── validators/        # shared Zod schemas (client + server)
│   ├── auth.ts / rbac.ts  # session + role enforcement
│   └── db.ts              # Prisma client
├── components/            # layout, dashboard, module UIs, shared
└── middleware.ts          # route protection
prisma/
├── schema.prisma          # full data model (incl. documents & notifications)
└── seed.ts                # realistic demo data
```

**Design principle:** UI never mutates state directly — every status change goes through a service function that validates and updates all affected entities in a single transaction.

---

## 🚀 Getting Started

```bash
# 1. Clone
git clone <repo-url> && cd transitops

# 2. Install
npm install

# 3. Environment — create .env with:
#    DATABASE_URL="postgresql://..."
#    NEXTAUTH_SECRET="<any random string>"
#    NEXTAUTH_URL="http://localhost:3000"

# 4. Database
npx prisma db push
npx prisma db seed

# 5. Run
npm run dev
```

### 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | manager@transitops.com | demo1234 |
| Driver | driver@transitops.com | demo1234 |
| Safety Officer | safety@transitops.com | demo1234 |
| Financial Analyst | finance@transitops.com | demo1234 |

---

## 👥 Team

| Member          | Role |
|-----------------|------|
| **Hirva**       | Team Lead — Architecture, Data Model, Integration, Design Direction, Demo |
| **Ogesh**       | Backend — Business Rules Engine, Trip & Maintenance Services |
| **Darshan**     | Backend — Authentication, RBAC, CRUD Services, Seed Data, Notifications |
| **Karmdipsinh** | Frontend — Dashboard, Layout System, Module Pages, Data Tables, Exports |

---

## 📸 Screenshots

_[Coming soon — dashboard, trip dispatch flow, reports]_

---

_Built in 8 hours for the ODDO Hackathon 2026 🏁_
