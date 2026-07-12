# TransitOps — Vehicle Registry Backend

A standalone CRUD module for **TransitOps: Smart Transport Operations Platform**,
covering spec section 3.3 (Vehicle Registry) and the related business rules from
section 4.

- Master list of vehicles: Registration Number (unique), Vehicle Name/Model, Type,
  Maximum Load Capacity, Odometer, Acquisition Cost, Status, and Region (for the
  dashboard filters in spec 3.2)
- Status values: `Available`, `On Trip`, `In Shop`, `Retired`
- Enforces: registration number uniqueness, and that Retired/In Shop vehicles
  never show up in the dispatch selection pool
- Filtering, free-text search, sorting, and pagination on the list endpoint
- Request validation and centralized error handling

This module is scoped to **only** the Vehicle Registry — no auth, trips,
maintenance, or expenses. It ships standalone (no dependency on the auth
backend) so it can be run and tested on its own; see "Wiring In Auth" below for
how to plug it behind the login system later.

## Tech Stack

- Node.js + Express
- JSON file storage via `lowdb` (zero setup — swap `models/Vehicle.js` for
  Postgres/Mongo later without touching controllers or routes)
- `express-validator` for input validation

## Project Structure

```
transitops-vehicle-registry/
├── config/
│   └── db.js                  # lowdb (JSON file) database setup
├── controllers/
│   └── vehicleController.js   # CRUD + dispatch-pool + status transition logic
├── middleware/
│   └── validators.js          # express-validator rules
├── models/
│   └── Vehicle.js             # data access + status enum + business rules
├── routes/
│   └── vehicleRoutes.js       # /api/vehicles/*
├── scripts/
│   └── seed.js                # sample vehicles across every status
├── data/
│   └── db.json                # auto-created on first run (git-ignored)
├── .env.example
├── package.json
└── server.js
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. (Optional) Seed sample vehicles
npm run seed

# 4. Start the server
npm start
# or, for auto-reload during development:
npm run dev
```

Server starts on `http://localhost:5001` by default (`PORT` in `.env`). A
different default port than the auth service (5000) was chosen so both can
run side by side during development.

## API Reference

### `GET /health`
Health check.

### `POST /api/vehicles`
Register a new vehicle.
```json
{
  "registrationNumber": "VAN-05",
  "name": "Ford Transit",
  "type": "Van",
  "maxLoadCapacity": 500,
  "odometer": 0,
  "acquisitionCost": 32000,
  "status": "Available",
  "region": "North"
}
```
`status` and `odometer` are optional (default to `Available` and `0`).
Returns **409** if `registrationNumber` already exists.

### `GET /api/vehicles`
List vehicles with optional query params:

| Param     | Description                                            |
|-----------|----------------------------------------------------------|
| `status`  | Filter by exact status (`Available`, `On Trip`, `In Shop`, `Retired`) |
| `type`    | Filter by vehicle type (case-insensitive)               |
| `region`  | Filter by region (case-insensitive)                     |
| `search`  | Free-text match on registration number, name, or type   |
| `sortBy`  | `registrationNumber` \| `name` \| `type` \| `odometer` \| `acquisitionCost` \| `createdAt` |
| `order`   | `asc` (default) or `desc`                                |
| `page`    | Page number, default `1`                                 |
| `limit`   | Page size, default `20`, max `100`                        |

Example: `GET /api/vehicles?status=Available&type=Van&sortBy=odometer&order=desc`

### `GET /api/vehicles/available`
Returns only vehicles eligible for dispatch (status `Available`) — the
endpoint the Trip Management module should call when populating its vehicle
picker. Enforces spec rule: *"Retired or In Shop vehicles must never appear
in the dispatch selection."*

### `GET /api/vehicles/:id`
Fetch a single vehicle.

### `PUT /api/vehicles/:id`
Update any subset of vehicle fields. Re-validates registration number
uniqueness if it's being changed.

### `PATCH /api/vehicles/:id/status`
Dedicated status-transition endpoint (the Trip and Maintenance modules should
call this to flip a vehicle to `On Trip` / `In Shop` / `Available`, per spec
section 4's automatic status transitions).
```json
{ "status": "In Shop" }
```
Rejects the change with **400** if the vehicle is currently `Retired`
(a retired vehicle cannot be un-retired through this endpoint).

### `DELETE /api/vehicles/:id`
Hard-deletes a vehicle record. Prefer setting status to `Retired` via the
status endpoint instead, to preserve history for reports — this is provided
mainly for cleaning up test/duplicate entries.

## Wiring In Auth

This module has no authentication of its own. To protect it with the
TransitOps auth backend's RBAC (Fleet Manager should own this data), import
its middleware into `routes/vehicleRoutes.js`:

```js
const authenticate = require('../../transitops-auth-backend/middleware/auth');
const authorize = require('../../transitops-auth-backend/middleware/rbac');
const { ROLES } = require('../../transitops-auth-backend/models/User');

router.post(
  '/',
  authenticate,
  authorize(ROLES.FLEET_MANAGER, ROLES.ADMIN),
  createVehicleRules,
  vehicleController.createVehicle
);
```

Or, more simply once both services are merged into one Express app, mount
`vehicleRoutes` under `/api/vehicles` in the auth backend's `server.js` and
apply `authenticate`/`authorize` there.
