const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

// Tighter limit on auth endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post("/admin/login", authLimiter, ctrl.adminLogin);
router.post("/taxpayer/lookup", authLimiter, ctrl.taxpayerLookup);
router.post("/taxpayer/request-otp", authLimiter, ctrl.requestOtp);
router.post("/taxpayer/activate", authLimiter, ctrl.verifyOtpAndActivate);
router.post("/taxpayer/login", authLimiter, ctrl.taxpayerLogin);
router.get("/me", authenticate, ctrl.me);
router.post("/logout", authenticate, ctrl.logout);

module.exports = router;
