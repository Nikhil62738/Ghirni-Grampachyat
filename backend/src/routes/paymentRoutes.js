const router = require("express").Router();
const ctrl = require("../controllers/paymentController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

// Taxpayer online payment flow
router.post("/online/order", authenticate, requireRole(ROLES.TAXPAYER), ctrl.createOnlineOrder);
router.post("/online/verify", authenticate, requireRole(ROLES.TAXPAYER), ctrl.verifyOnlinePayment);

// Admin payment management
router.get("/", authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_PAYMENTS), ctrl.listPayments);
router.post("/offline", authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_PAYMENTS), ctrl.collectOffline);

module.exports = router;
