const { ROLES } = require("../config/constants");
const { fail } = require("../utils/apiResponse");

// Ensures the authenticated admin holds the given permission (super admin bypasses).
function requirePermission(permission) {
  return function check(req, res, next) {
    if (req.userRole !== ROLES.ADMIN) {
      return fail(res, "Forbidden: admin access required", 403);
    }
    const admin = req.user;
    if (admin.isSuperAdmin || (admin.permissions || []).includes(permission)) {
      return next();
    }
    return fail(res, `Forbidden: missing permission '${permission}'`, 403);
  };
}

module.exports = { requirePermission };
