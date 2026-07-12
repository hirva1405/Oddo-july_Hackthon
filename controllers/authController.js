const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!User.VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${User.VALID_ROLES.join(', ')}`
      });
    }

    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.createUser({ name, email, password, role });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: User.toPublicUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while registering.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = User.findByEmail(email);
    // Deliberately vague message on failure so we don't leak which part was wrong
    const invalidCredsMessage = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({ success: false, message: invalidCredsMessage });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended. Contact an administrator.' });
    }

    const passwordMatches = await User.comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: invalidCredsMessage });
    }

    User.updateLastLogin(user.id);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: User.toPublicUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong while logging in.' });
  }
}

// POST /api/auth/refresh
function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    const accessToken = signAccessToken(user);
    return res.status(200).json({ success: true, data: { accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
}

// GET /api/auth/me  (protected)
function me(req, res) {
  const user = User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  return res.status(200).json({ success: true, data: { user: User.toPublicUser(user) } });
}

// POST /api/auth/logout  (protected)
// Stateless JWT setup: the client discards its tokens. This endpoint exists
// mainly as a clear contract point for the frontend, and as a place to plug
// in a token-blacklist/Redis store later if you need server-side invalidation.
function logout(req, res) {
  return res.status(200).json({ success: true, message: 'Logged out successfully. Discard your tokens client-side.' });
}

module.exports = { register, login, refresh, me, logout };
