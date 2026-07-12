// Role-Based Access Control (spec 3.1: "Support Role-Based Access Control (RBAC)")
//
// Usage:
//   router.get('/fleet/vehicles', authenticate, authorize('fleet_manager', 'admin'), handler)
//
// Must run AFTER the `authenticate` middleware, since it relies on req.user.

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }

    return next();
  };
}

module.exports = authorize;
