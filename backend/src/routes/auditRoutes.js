const router = require("express").Router();
const ctrl = require("../controllers/auditController");
const { authenticate, requireRole } = require("../middleware/auth");
const { ROLES } = require("../config/constants");

// Audit logs are visible to admins (super admin sees all).
router.get("/", authenticate, requireRole(ROLES.ADMIN), ctrl.listAuditLogs);

module.exports = router;
