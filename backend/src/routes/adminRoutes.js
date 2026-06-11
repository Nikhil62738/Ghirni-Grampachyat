const router = require("express").Router();
const ctrl = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get("/", requirePermission(PERMISSIONS.MANAGE_ADMINS), ctrl.listAdmins);
router.post("/", requirePermission(PERMISSIONS.MANAGE_ADMINS), ctrl.createAdmin);
router.patch("/:id", requirePermission(PERMISSIONS.MANAGE_ADMINS), ctrl.updateAdminPermissions);
router.delete("/:id", requirePermission(PERMISSIONS.MANAGE_ADMINS), ctrl.deleteAdmin);

module.exports = router;
