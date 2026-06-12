const Taxpayer = require("../models/Taxpayer");
const Payment = require("../models/Payment");
const Receipt = require("../models/Receipt");
const Notification = require("../models/Notification");
const Announcement = require("../models/Announcement");
const Otp = require("../models/Otp");
const asyncHandler = require("../utils/asyncHandler");
const { success, created, fail, ApiError } = require("../utils/apiResponse");
const { generateTaxpayerId } = require("../utils/ids");
const { logAudit } = require("../services/auditService");
const { ROLES } = require("../config/constants");

// ===== Admin: list + search + paginate =====
exports.listTaxpayers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const { search, ward, status } = req.query;

  const filter = {};
  if (ward) filter.wardNumber = ward;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(String(search).trim(), "i");
    filter.$or = [
      { fullName: rx },
      { mobileNumber: rx },
      { email: rx },
      { houseNumber: rx },
      { propertyNumber: rx },
      { taxpayerId: rx },
    ];
  }

  const [items, total] = await Promise.all([
    Taxpayer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Taxpayer.countDocuments(filter),
  ]);

  return success(res, { items, total, page, pages: Math.ceil(total / limit) });
});

exports.getTaxpayer = asyncHandler(async (req, res) => {
  const tp = await Taxpayer.findById(req.params.id);
  if (!tp) return fail(res, "Taxpayer not found", 404);
  return success(res, { taxpayer: tp });
});

exports.createTaxpayer = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  delete data.password;
  delete data.taxpayerId;
  data.taxpayerId = await generateTaxpayerId();

  const tp = new Taxpayer(data);
  if (typeof data.currentTax === "number" || typeof data.previousBalance === "number") {
    tp.recomputeDue();
  }
  await tp.save();

  await logAudit(req, { action: "taxpayer_created", entity: "Taxpayer", entityId: tp._id });
  return created(res, { taxpayer: tp }, "Taxpayer created");
});

exports.updateTaxpayer = asyncHandler(async (req, res) => {
  const tp = await Taxpayer.findById(req.params.id);
  if (!tp) return fail(res, "Taxpayer not found", 404);

  const fields = [
    "fullName", "fatherName", "houseNumber", "propertyNumber", "wardNumber", "village",
    "mobileNumber", "email", "aadhaarLast4", "address", "propertyType", "taxCategory",
    "currentTax", "previousBalance", "penalty", "dueDate", "status",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) tp[f] = req.body[f];
  });
  tp.recomputeDue();
  await tp.save();

  await logAudit(req, { action: "taxpayer_updated", entity: "Taxpayer", entityId: tp._id });
  return success(res, { taxpayer: tp }, "Taxpayer updated");
});

exports.deleteTaxpayer = asyncHandler(async (req, res) => {
  const tp = await Taxpayer.findByIdAndDelete(req.params.id);
  if (!tp) return fail(res, "Taxpayer not found", 404);

  // Cascade: remove all of this taxpayer's history so nothing is orphaned.
  const [payments, receipts, notifications, otps] = await Promise.all([
    Payment.deleteMany({ taxpayer: tp._id }),
    Receipt.deleteMany({ taxpayer: tp._id }),
    Notification.deleteMany({ taxpayer: tp._id }),
    Otp.deleteMany({ taxpayer: tp._id }),
  ]);

  await logAudit(req, {
    action: "taxpayer_deleted",
    entity: "Taxpayer",
    entityId: req.params.id,
    details: {
      deletedPayments: payments.deletedCount,
      deletedReceipts: receipts.deletedCount,
      deletedNotifications: notifications.deletedCount,
      deletedOtps: otps.deletedCount,
    },
  });
  return success(res, {}, "Taxpayer and all related history deleted");
});

// ===== Taxpayer self: dashboard =====
exports.myDashboard = asyncHandler(async (req, res) => {
  if (req.userRole !== ROLES.TAXPAYER) throw new ApiError("Taxpayer access only", 403);
  const tp = await Taxpayer.findById(req.user._id);
  if (!tp) return fail(res, "Record not found", 404);

  const [payments, receipts, announcements, unreadCount] = await Promise.all([
    Payment.find({ taxpayer: tp._id, status: "paid" }).sort({ createdAt: -1 }).limit(50),
    Receipt.find({ taxpayer: tp._id }).sort({ createdAt: -1 }).limit(50),
    Announcement.find({ active: true }).sort({ pinned: -1, createdAt: -1 }).limit(10),
    Notification.countDocuments({ taxpayer: tp._id, read: { $ne: true } }),
  ]);

  return success(res, {
    profile: {
      taxpayerId: tp.taxpayerId,
      fullName: tp.fullName,
      fatherName: tp.fatherName,
      houseNumber: tp.houseNumber,
      propertyNumber: tp.propertyNumber,
      wardNumber: tp.wardNumber,
      village: tp.village,
      mobileNumber: tp.mobileNumber,
      email: tp.email,
      address: tp.address,
    },
    taxSummary: {
      previousBalance: tp.previousBalance,
      currentTax: tp.currentTax,
      penalty: tp.penalty,
      totalDue: tp.totalDue,
      paidAmount: tp.paidAmount,
      remainingAmount: tp.totalDue,
      dueDate: tp.dueDate,
      status: tp.totalDue > 0 ? "Pending" : "Paid",
    },
    taxHistory: tp.taxHistory,
    payments,
    receipts,
    announcements,
    unreadCount,
  });
});

// ===== Taxpayer self: in-app notifications =====
exports.myNotifications = asyncHandler(async (req, res) => {
  if (req.userRole !== ROLES.TAXPAYER) throw new ApiError("Taxpayer access only", 403);
  const [items, unread] = await Promise.all([
    Notification.find({ taxpayer: req.user._id }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ taxpayer: req.user._id, read: { $ne: true } }),
  ]);
  return success(res, { items, unread });
});

// ===== Taxpayer self: mark notifications as read =====
exports.markNotificationsRead = asyncHandler(async (req, res) => {
  if (req.userRole !== ROLES.TAXPAYER) throw new ApiError("Taxpayer access only", 403);
  const { ids } = req.body || {};
  const filter = { taxpayer: req.user._id };
  if (Array.isArray(ids) && ids.length) filter._id = { $in: ids };
  await Notification.updateMany(filter, { $set: { read: true, readAt: new Date() } });
  const unread = await Notification.countDocuments({ taxpayer: req.user._id, read: { $ne: true } });
  return success(res, { unread }, "Notifications marked as read");
});
