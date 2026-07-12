const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const {
  createVehicleRules,
  updateVehicleRules,
  statusUpdateRules,
  listVehicleRules
} = require('../middleware/validators');

const router = express.Router();

// NOTE: This module ships standalone. If you're wiring it up behind the
// TransitOps auth service, add `authenticate` (and `authorize` where needed)
// from that project's middleware to these routes, e.g.:
//
//   router.post('/', authenticate, authorize(ROLES.FLEET_MANAGER, ROLES.ADMIN), createVehicleRules, vehicleController.createVehicle);

router.get('/available', vehicleController.listAvailableForDispatch);
router.get('/', listVehicleRules, vehicleController.listVehicles);
router.post('/', createVehicleRules, vehicleController.createVehicle);
router.get('/:id', vehicleController.getVehicle);
router.put('/:id', updateVehicleRules, vehicleController.updateVehicle);
router.patch('/:id/status', statusUpdateRules, vehicleController.updateVehicleStatus);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
