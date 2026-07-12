// Run with: npm run seed
// Populates the registry with a handful of sample vehicles across every
// status, so the frontend/dashboard team can start testing immediately.

require('dotenv').config();
const Vehicle = require('../models/Vehicle');

const sampleVehicles = [
  {
    registrationNumber: 'VAN-05',
    name: 'Ford Transit',
    type: 'Van',
    maxLoadCapacity: 500,
    odometer: 18342,
    acquisitionCost: 32000,
    status: Vehicle.STATUS.AVAILABLE,
    region: 'North'
  },
  {
    registrationNumber: 'TRK-12',
    name: 'Volvo FH16',
    type: 'Truck',
    maxLoadCapacity: 12000,
    odometer: 94210,
    acquisitionCost: 145000,
    status: Vehicle.STATUS.ON_TRIP,
    region: 'South'
  },
  {
    registrationNumber: 'BUS-01',
    name: 'Mercedes Sprinter',
    type: 'Bus',
    maxLoadCapacity: 2500,
    odometer: 51230,
    acquisitionCost: 68000,
    status: Vehicle.STATUS.IN_SHOP,
    region: 'East'
  },
  {
    registrationNumber: 'CAR-22',
    name: 'Toyota Corolla',
    type: 'Car',
    maxLoadCapacity: 400,
    odometer: 132000,
    acquisitionCost: 21000,
    status: Vehicle.STATUS.RETIRED,
    region: 'West'
  },
  {
    registrationNumber: 'VAN-09',
    name: 'Mercedes Vito',
    type: 'Van',
    maxLoadCapacity: 800,
    odometer: 7420,
    acquisitionCost: 34500,
    status: Vehicle.STATUS.AVAILABLE,
    region: 'North'
  }
];

sampleVehicles.forEach((v) => {
  const existing = Vehicle.findByRegistrationNumber(v.registrationNumber);
  if (existing) {
    console.log(`Skipping (already exists): ${v.registrationNumber}`);
    return;
  }
  Vehicle.create(v);
  console.log(`Created vehicle: ${v.registrationNumber} — ${v.name} (${v.status})`);
});

console.log('\nSeed complete.');
