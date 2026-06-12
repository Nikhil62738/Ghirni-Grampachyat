const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
router.use("/admins", require("./adminRoutes"));
router.use("/taxpayers", require("./taxpayerRoutes"));
router.use("/payments", require("./paymentRoutes"));
router.use("/receipts", require("./receiptRoutes"));
router.use("/reports", require("./reportRoutes"));
router.use("/analytics", require("./analyticsRoutes"));
router.use("/notifications", require("./notificationRoutes"));
router.use("/audit-logs", require("./auditRoutes"));
router.use("/settings", require("./settingsRoutes"));
router.use("/announcements", require("./announcementRoutes"));

router.get("/health", (req, res) => res.json({ success: true, status: "ok", time: new Date() }));

module.exports = router;
