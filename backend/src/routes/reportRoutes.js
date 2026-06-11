const router = require("express").Router();
const ctrl = require("../controllers/reportController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

router.get(
  "/",
  authenticate,
  requireRole(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  ctrl.getReport
);

module.exports = router;
