const router = require("express").Router();
const ctrl = require("../controllers/receiptController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");

// Public verification (QR scan)
router.get("/verify/:token", ctrl.verifyReceipt);

// Authenticated download (admin or owning taxpayer)
router.get("/:id/download", authenticate, ctrl.downloadReceipt);

// Admin listing
router.get("/", authenticate, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.MANAGE_RECEIPTS), ctrl.listReceipts);

module.exports = router;
