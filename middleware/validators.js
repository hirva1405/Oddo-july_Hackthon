const { body, query, validationResult } = require('express-validator');
const { VALID_STATUSES } = require('../models/Vehicle');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
    });
  }
  return next();
}

const createVehicleRules = [
  body('registrationNumber').trim().notEmpty().withMessage('Registration Number is required.'),
  body('name').trim().notEmpty().withMessage('Vehicle Name/Model is required.'),
  body('type').trim().notEmpty().withMessage('Vehicle Type is required.'),
  body('maxLoadCapacity')
    .isFloat({ gt: 0 })
    .withMessage('Maximum Load Capacity must be a positive number.'),
  body('odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer must be zero or a positive number.'),
  body('acquisitionCost')
    .isFloat({ min: 0 })
    .withMessage('Acquisition Cost must be zero or a positive number.'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('region').optional().trim(),
  handleValidationErrors
];

const updateVehicleRules = [
  body('registrationNumber').optional().trim().notEmpty().withMessage('Registration Number cannot be empty.'),
  body('name').optional().trim().notEmpty().withMessage('Vehicle Name/Model cannot be empty.'),
  body('type').optional().trim().notEmpty().withMessage('Vehicle Type cannot be empty.'),
  body('maxLoadCapacity')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Maximum Load Capacity must be a positive number.'),
  body('odometer').optional().isFloat({ min: 0 }).withMessage('Odometer must be zero or a positive number.'),
  body('acquisitionCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition Cost must be zero or a positive number.'),
  body('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('region').optional().trim(),
  handleValidationErrors
];

const statusUpdateRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  handleValidationErrors
];

const listVehicleRules = [
  query('status').optional().isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  query('type').optional().trim(),
  query('region').optional().trim(),
  query('search').optional().trim(),
  query('sortBy')
    .optional()
    .isIn(['registrationNumber', 'name', 'type', 'odometer', 'acquisitionCost', 'createdAt'])
    .withMessage('Invalid sortBy field.'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc.'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100.'),
  handleValidationErrors
];

module.exports = {
  createVehicleRules,
  updateVehicleRules,
  statusUpdateRules,
  listVehicleRules
};
