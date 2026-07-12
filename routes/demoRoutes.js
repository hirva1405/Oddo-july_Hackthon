const express = require('express');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../models/User');

const router = express.Router();

// These routes are just references showing how the rest of the TransitOps
// modules (Fleet, Trips, Safety, Finance) should protect their endpoints
// using the same `authenticate` + `authorize` pair.

router.get(
  '/fleet-manager',
  authenticate,
  authorize(ROLES.FLEET_MANAGER, ROLES.ADMIN),
  (req, res) => res.json({ success: true, message: `Welcome, Fleet Manager ${req.user.name}.` })
);

router.get(
  '/driver',
  authenticate,
  authorize(ROLES.DRIVER, ROLES.ADMIN),
  (req, res) => res.json({ success: true, message: `Welcome, Driver ${req.user.name}.` })
);

router.get(
  '/safety-officer',
  authenticate,
  authorize(ROLES.SAFETY_OFFICER, ROLES.ADMIN),
  (req, res) => res.json({ success: true, message: `Welcome, Safety Officer ${req.user.name}.` })
);

router.get(
  '/financial-analyst',
  authenticate,
  authorize(ROLES.FINANCIAL_ANALYST, ROLES.ADMIN),
  (req, res) => res.json({ success: true, message: `Welcome, Financial Analyst ${req.user.name}.` })
);

// Any authenticated user, regardless of role
router.get('/any-authenticated-user', authenticate, (req, res) =>
  res.json({ success: true, message: `Hello ${req.user.name}, you are authenticated as ${req.user.role}.` })
);

module.exports = router;
