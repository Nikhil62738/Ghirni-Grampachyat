const router = require("express").Router();
const ctrl = require("../controllers/notificationController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

router.use(authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS));
router.get("/", ctrl.listNotifications);
router.post("/remind-defaulters", ctrl.remindDefaulters);

module.exports = router;
