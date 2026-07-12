const Vehicle = require('../models/Vehicle');

// POST /api/vehicles
function createVehicle(req, res) {
  try {
    const { registrationNumber } = req.body;

    // Business rule (spec 4): "The vehicle registration number must be unique."
    const existing = Vehicle.findByRegistrationNumber(registrationNumber);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A vehicle with registration number "${registrationNumber}" already exists.`
      });
    }

    const vehicle = Vehicle.create(req.body);
    return res.status(201).json({ success: true, message: 'Vehicle registered successfully.', data: { vehicle } });
  } catch (err) {
    console.error('createVehicle error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while registering the vehicle.' });
  }
}

// GET /api/vehicles
// Supports filtering by type/status/region (spec 3.2), free-text search,
// sorting, and pagination.
function listVehicles(req, res) {
  try {
    let vehicles = Vehicle.all();

    const { status, type, region, search, sortBy, order, page, limit } = req.query;

    if (status) vehicles = vehicles.filter((v) => v.status === status);
    if (type) vehicles = vehicles.filter((v) => v.type.toLowerCase() === type.toLowerCase());
    if (region) vehicles = vehicles.filter((v) => (v.region || '').toLowerCase() === region.toLowerCase());

    if (search) {
      const term = search.toLowerCase();
      vehicles = vehicles.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(term) ||
          v.name.toLowerCase().includes(term) ||
          v.type.toLowerCase().includes(term)
      );
    }

    const sortField = sortBy || 'createdAt';
    const sortOrder = order === 'desc' ? -1 : 1;
    vehicles = [...vehicles].sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1 * sortOrder;
      if (a[sortField] > b[sortField]) return 1 * sortOrder;
      return 0;
    });

    const totalCount = vehicles.length;
    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 20;
    const start = (pageNum - 1) * pageSize;
    const paginated = vehicles.slice(start, start + pageSize);

    return res.status(200).json({
      success: true,
      data: {
        vehicles: paginated,
        pagination: {
          totalCount,
          page: pageNum,
          limit: pageSize,
          totalPages: Math.ceil(totalCount / pageSize) || 1
        }
      }
    });
  } catch (err) {
    console.error('listVehicles error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while listing vehicles.' });
  }
}

// GET /api/vehicles/available
// Vehicles eligible for dispatch selection only.
// Business rule (spec 4): "Retired or In Shop vehicles must never appear in
// the dispatch selection."
function listAvailableForDispatch(req, res) {
  const vehicles = Vehicle.availableForDispatch().filter((v) => v.status === Vehicle.STATUS.AVAILABLE);
  return res.status(200).json({ success: true, data: { vehicles } });
}

// GET /api/vehicles/:id
function getVehicle(req, res) {
  const vehicle = Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found.' });
  }
  return res.status(200).json({ success: true, data: { vehicle } });
}

// PUT /api/vehicles/:id
function updateVehicle(req, res) {
  try {
    const vehicle = Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // If registration number is being changed, re-check uniqueness
    if (req.body.registrationNumber) {
      const clash = Vehicle.findByRegistrationNumber(req.body.registrationNumber);
      if (clash && clash.id !== vehicle.id) {
        return res.status(409).json({
          success: false,
          message: `A vehicle with registration number "${req.body.registrationNumber}" already exists.`
        });
      }
      req.body.registrationNumber = req.body.registrationNumber.trim().toUpperCase();
    }

    const updated = Vehicle.update(req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Vehicle updated successfully.', data: { vehicle: updated } });
  } catch (err) {
    console.error('updateVehicle error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while updating the vehicle.' });
  }
}

// PATCH /api/vehicles/:id/status
// Dedicated endpoint for status transitions, since these drive dispatch
// eligibility and are usually triggered by other modules (Trips, Maintenance).
function updateVehicleStatus(req, res) {
  const vehicle = Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found.' });
  }

  if (vehicle.status === Vehicle.STATUS.RETIRED) {
    return res.status(400).json({
      success: false,
      message: 'This vehicle is Retired and cannot be transitioned to another status.'
    });
  }

  const { status } = req.body;
  const updated = Vehicle.update(req.params.id, { status });
  return res.status(200).json({ success: true, message: `Vehicle status updated to "${status}".`, data: { vehicle: updated } });
}

// DELETE /api/vehicles/:id
// Prefer retiring a vehicle (PATCH status = "Retired") to preserve history.
// This hard-delete is provided for cleaning up test/duplicate records.
function deleteVehicle(req, res) {
  const removed = Vehicle.remove(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Vehicle not found.' });
  }
  return res.status(200).json({ success: true, message: 'Vehicle deleted successfully.' });
}

module.exports = {
  createVehicle,
  listVehicles,
  listAvailableForDispatch,
  getVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle
};
