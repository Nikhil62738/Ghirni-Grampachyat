const { verifyToken } = require("../utils/token");
const Admin = require("../models/Admin");
const Taxpayer = require("../models/Taxpayer");
const { ROLES } = require("../config/constants");
const { fail } = require("../utils/apiResponse");

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

// Authenticates either an Admin or a Taxpayer based on token role.
function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return fail(res, "Authentication required", 401);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return fail(res, "Invalid or expired token", 401);
  }

  const loader = decoded.role === ROLES.ADMIN ? Admin : Taxpayer;
  loader
    .findById(decoded.id)
    .then((account) => {
      if (!account || account.isActive === false) {
        return fail(res, "Account not found or inactive", 401);
      }
      req.user = account;
      req.userRole = decoded.role;
      return next();
    })
    .catch(next);
}

function requireRole(...roles) {
  return function check(req, res, next) {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return fail(res, "Forbidden: insufficient role", 403);
    }
    return next();
  };
}

module.exports = { authenticate, requireRole, extractToken };
