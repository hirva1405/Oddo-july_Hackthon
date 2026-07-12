const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validators');

const router = express.Router();

// Basic brute-force protection on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' }
});

router.post('/register', authLimiter, registerRules, authController.register);
router.post('/login', authLimiter, loginRules, authController.login);
router.post('/refresh', authController.refresh);

router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
