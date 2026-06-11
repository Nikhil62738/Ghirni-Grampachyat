const router = require("express").Router();
const ctrl = require("../controllers/analyticsController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

router.use(authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_ANALYTICS));
router.get("/overview", ctrl.overview);
router.get("/charts", ctrl.charts);

module.exports = router;
