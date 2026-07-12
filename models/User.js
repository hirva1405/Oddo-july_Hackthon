const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Roles defined by the TransitOps spec (section 2: Target Users)
const ROLES = Object.freeze({
  FLEET_MANAGER: 'fleet_manager',
  DRIVER: 'driver',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
  ADMIN: 'admin' // extra role: full platform administration
});

const VALID_ROLES = Object.values(ROLES);

function findByEmail(email) {
  return db.get('users').find({ email: email.toLowerCase() }).value();
}

function findById(id) {
  return db.get('users').find({ id }).value();
}

async function createUser({ name, email, password, role }) {
  const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    status: 'active', // active | suspended
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };

  db.get('users').push(user).write();
  return user;
}

function updateLastLogin(id) {
  db.get('users')
    .find({ id })
    .assign({ lastLoginAt: new Date().toISOString() })
    .write();
}

function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// Strips sensitive fields before sending the user object back to a client
function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = {
  ROLES,
  VALID_ROLES,
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  comparePassword,
  toPublicUser
};
