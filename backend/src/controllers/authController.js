const crypto = require("crypto");
const Admin = require("../models/Admin");
const Taxpayer = require("../models/Taxpayer");
const Otp = require("../models/Otp");
const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");
const { success, fail, ApiError } = require("../utils/apiResponse");
const { ROLES, TAXPAYER_STATUS, NOTIFICATION_TYPES } = require("../config/constants");
const { sendMail, isConfigured: emailIsConfigured } = require("../services/emailService");
const { otpEmail } = require("../services/emailTemplates");
const { notify } = require("../services/notificationService");
const { logAudit } = require("../services/auditService");

// Build a lookup filter that matches a taxpayer by email, mobile number, or
// Taxpayer ID (e.g. "GPG-TP-000001"). Taxpayer IDs are generated in uppercase.
function taxpayerIdentifierFilter(identifier) {
  const id = String(identifier || "").trim();
  return {
    $or: [
      { email: id.toLowerCase() },
      { mobileNumber: id },
      { taxpayerId: id.toUpperCase() },
    ],
  };
}

function sanitizeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: ROLES.ADMIN,
    isSuperAdmin: admin.isSuperAdmin,
    permissions: admin.permissions,
  };
}

function sanitizeTaxpayer(tp) {
  return {
    id: tp._id,
    name: tp.fullName,
    taxpayerId: tp.taxpayerId,
    email: tp.email,
    role: ROLES.TAXPAYER,
    status: tp.status,
  };
}

// ===== Admin login =====
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError("Email and password are required", 400);

  const admin = await Admin.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    return fail(res, "Invalid credentials", 401);
  }
  if (!admin.isActive) return fail(res, "Account is disabled", 403);

  admin.lastLogin = new Date();
  await admin.save();

  const token = signToken({ id: admin._id, role: ROLES.ADMIN });
  await logAudit(req, { action: "admin_login", entity: "Admin", entityId: admin._id });
  return success(res, { token, user: sanitizeAdmin(admin) }, "Login successful");
});

// ===== Taxpayer: lookup by email, mobile, or Taxpayer ID =====
exports.taxpayerLookup = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) throw new ApiError("Email, mobile number or Taxpayer ID is required", 400);

  const tp = await Taxpayer.findOne(taxpayerIdentifierFilter(identifier));

  if (!tp) {
    return fail(
      res,
      "Your information is not available in Gram Panchayat records. Please contact Gram Panchayat Office.",
      404
    );
  }

  return success(
    res,
    {
      found: true,
      taxpayerId: tp.taxpayerId,
      name: tp.fullName,
      maskedEmail: tp.email ? tp.email.replace(/(.{2}).*(@.*)/, "$1***$2") : null,
      isActivated: tp.isActivated,
    },
    tp.isActivated
      ? "Account already activated. Please login."
      : "Your taxpayer record is available. Please activate your account."
  );
});

// ===== Taxpayer: request activation OTP =====
exports.requestOtp = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const tp = await Taxpayer.findOne(taxpayerIdentifierFilter(identifier));
  if (!tp) return fail(res, "Taxpayer record not found", 404);
  if (!tp.email) return fail(res, "No email on file. Please contact the Gram Panchayat Office.", 400);
  if (!emailIsConfigured()) {
    return fail(
      res,
      "Email service is not configured. Please configure Gmail in the server to send OTP emails.",
      503
    );
  }

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await Otp.hashCode(code);

  await Otp.deleteMany({ taxpayer: tp._id, purpose: "activation" });
  await Otp.create({
    taxpayer: tp._id,
    email: tp.email,
    codeHash,
    purpose: "activation",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const gp = await Settings.getGlobal();
  const { subject, html } = otpEmail(tp, code, gp);
  await sendMail({ to: tp.email, subject, html });

  return success(res, { sent: true }, "OTP sent to your registered email");
});

// ===== Taxpayer: verify OTP + set password (activation) =====
exports.verifyOtpAndActivate = asyncHandler(async (req, res) => {
  const { identifier, otp, password } = req.body;
  if (!otp || !password) throw new ApiError("OTP and password are required", 400);
  if (String(password).length < 6) throw new ApiError("Password must be at least 6 characters", 400);

  const tp = await Taxpayer.findOne(taxpayerIdentifierFilter(identifier));
  if (!tp) return fail(res, "Taxpayer record not found", 404);

  const otpDoc = await Otp.findOne({ taxpayer: tp._id, purpose: "activation" });
  if (!otpDoc) return fail(res, "OTP expired or not requested. Please request again.", 400);
  if (otpDoc.attempts >= 5) {
    await otpDoc.deleteOne();
    return fail(res, "Too many attempts. Please request a new OTP.", 429);
  }

  const ok = await otpDoc.verifyCode(String(otp));
  if (!ok) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return fail(res, "Invalid OTP", 400);
  }

  tp.password = password;
  tp.isActivated = true;
  tp.status = TAXPAYER_STATUS.ACTIVE;
  await tp.save();
  await otpDoc.deleteOne();

  await notify(NOTIFICATION_TYPES.ACCOUNT_ACTIVATED, tp).catch(() => {});
  await logAudit(req, { action: "taxpayer_activated", entity: "Taxpayer", entityId: tp._id });

  const token = signToken({ id: tp._id, role: ROLES.TAXPAYER });
  return success(res, { token, user: sanitizeTaxpayer(tp) }, "Account activated successfully");
});

// ===== Taxpayer login =====
exports.taxpayerLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError("Identifier and password are required", 400);

  const tp = await Taxpayer.findOne(taxpayerIdentifierFilter(identifier)).select("+password");

  if (!tp || !tp.isActivated) return fail(res, "Account not activated or not found", 401);
  if (!(await tp.comparePassword(password))) return fail(res, "Invalid credentials", 401);

  await logAudit(req, { action: "taxpayer_login", entity: "Taxpayer", entityId: tp._id });
  const token = signToken({ id: tp._id, role: ROLES.TAXPAYER });
  return success(res, { token, user: sanitizeTaxpayer(tp) }, "Login successful");
});

// ===== Current account =====
exports.me = asyncHandler(async (req, res) => {
  if (req.userRole === ROLES.ADMIN) return success(res, { user: sanitizeAdmin(req.user) });
  return success(res, { user: sanitizeTaxpayer(req.user) });
});

// ===== Logout (stateless; for audit only) =====
exports.logout = asyncHandler(async (req, res) => {
  await logAudit(req, { action: `${req.userRole}_logout` });
  return success(res, {}, "Logged out");
});
