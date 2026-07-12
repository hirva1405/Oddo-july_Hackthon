const { body, validationResult } = require('express-validator');
const { VALID_ROLES } = require('../models/User');

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

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  body('role')
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  handleValidationErrors
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors
];

module.exports = { registerRules, loginRules };
