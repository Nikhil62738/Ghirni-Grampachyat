const router = require("express").Router();
const ctrl = require("../controllers/settingsController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

router.use(authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_SETTINGS));
router.get("/", ctrl.getSettings);
router.patch("/", ctrl.updateSettings);
router.post("/run-tax", ctrl.runTaxNow);
router.get("/backup", ctrl.backup);

module.exports = router;
