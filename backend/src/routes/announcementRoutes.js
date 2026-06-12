const router = require("express").Router();
const ctrl = require("../controllers/announcementController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

// Any authenticated user (taxpayer or admin) can read active announcements.
router.get("/", authenticate, ctrl.listPublic);

// Admin management (requires the notifications permission).
const adminGuard = [
  authenticate,
  requireRole(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MANAGE_NOTIFICATIONS),
];
router.get("/all", adminGuard, ctrl.listAll);
router.post("/", adminGuard, ctrl.create);
router.patch("/:id", adminGuard, ctrl.update);
router.delete("/:id", adminGuard, ctrl.remove);

module.exports = router;
