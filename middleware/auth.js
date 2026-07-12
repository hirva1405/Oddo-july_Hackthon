const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

// Requires a valid "Authorization: Bearer <token>" header.
// Only authenticated users should access the application (spec 3.1).
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>'
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'This account has been suspended.' });
    }

    // Attach a lightweight, non-sensitive user context to the request
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token has expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token.' });
  }
}

module.exports = authenticate;
