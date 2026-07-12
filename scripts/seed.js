// Run with: npm run seed
// Creates one sample login for each TransitOps role so the frontend team
// can start testing RBAC immediately, without registering accounts by hand.
//
// All seeded accounts use the password: Passw0rd1

require('dotenv').config();
const User = require('../models/User');

const SAMPLE_PASSWORD = 'Passw0rd1';

const sampleUsers = [
  { name: 'Fiona Fleet', email: 'fleetmanager@transitops.dev', role: User.ROLES.FLEET_MANAGER },
  { name: 'Derek Driver', email: 'driver@transitops.dev', role: User.ROLES.DRIVER },
  { name: 'Sasha Safety', email: 'safetyofficer@transitops.dev', role: User.ROLES.SAFETY_OFFICER },
  { name: 'Farid Finance', email: 'analyst@transitops.dev', role: User.ROLES.FINANCIAL_ANALYST },
  { name: 'Ada Admin', email: 'admin@transitops.dev', role: User.ROLES.ADMIN }
];

(async () => {
  for (const u of sampleUsers) {
    const existing = User.findByEmail(u.email);
    if (existing) {
      console.log(`Skipping (already exists): ${u.email}`);
      continue;
    }
    await User.createUser({ ...u, password: SAMPLE_PASSWORD });
    console.log(`Created ${u.role}: ${u.email}`);
  }
  console.log(`\nAll seeded accounts use the password: ${SAMPLE_PASSWORD}`);
})();
