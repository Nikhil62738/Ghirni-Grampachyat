const router = require("express").Router();
const ctrl = require("../controllers/taxpayerController");
const importCtrl = require("../controllers/importController");
const { authenticate, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { ROLES, PERMISSIONS } = require("../config/constants");
const { excelUpload } = require("../middleware/upload");

// Taxpayer self dashboard
router.get("/me/dashboard", authenticate, requireRole(ROLES.TAXPAYER), ctrl.myDashboard);

// Admin-managed taxpayer routes
router.use(authenticate, requireRole(ROLES.ADMIN));
const canManage = requirePermission(PERMISSIONS.MANAGE_TAXPAYERS);

router.get("/", canManage, ctrl.listTaxpayers);
router.post("/", canManage, ctrl.createTaxpayer);
router.post("/import", canManage, excelUpload.single("file"), importCtrl.importTaxpayers);
router.get("/:id", canManage, ctrl.getTaxpayer);
router.patch("/:id", canManage, ctrl.updateTaxpayer);
router.delete("/:id", canManage, ctrl.deleteTaxpayer);

module.exports = router;
