const Receipt = require("../models/Receipt");
const Taxpayer = require("../models/Taxpayer");
const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");
const { success, fail } = require("../utils/apiResponse");
const { generateReceiptPdf } = require("../services/pdfService");
const { verificationUrl } = require("../services/qrService");
const { ROLES } = require("../config/constants");
const { logAudit } = require("../services/auditService");

// ===== List receipts (admin) =====
exports.listReceipts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.search) filter.receiptNumber = new RegExp(String(req.query.search).trim(), "i");

  const [items, total] = await Promise.all([
    Receipt.find(filter).populate("taxpayer", "fullName taxpayerId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Receipt.countDocuments(filter),
  ]);
  return success(res, { items, total, page, pages: Math.ceil(total / limit) });
});

// ===== Download a receipt PDF =====
exports.downloadReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id).populate("taxpayer");
  if (!receipt) return fail(res, "Receipt not found", 404);

  // Taxpayers may only download their own receipts.
  if (
    req.userRole === ROLES.TAXPAYER &&
    (!receipt.taxpayer || String(receipt.taxpayer._id) !== String(req.user._id))
  ) {
    return fail(res, "Forbidden", 403);
  }

  const settings = await Settings.getGlobal();
  const pdfBuffer = await generateReceiptPdf({
    receipt,
    taxpayer: receipt.taxpayer,
    settings,
    verifyUrl: verificationUrl(receipt.verificationToken),
  });

  await logAudit(req, { action: "receipt_downloaded", entity: "Receipt", entityId: receipt._id });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${receipt.receiptNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`);
  return res.send(pdfBuffer);
});

// ===== Public QR verification =====
exports.verifyReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findOne({ verificationToken: req.params.token }).populate("taxpayer", "fullName taxpayerId");
  if (!receipt) return fail(res, "Invalid or unknown receipt", 404);

  return success(res, {
    valid: true,
    receiptNumber: receipt.receiptNumber,
    taxpayerName: receipt.taxpayer ? receipt.taxpayer.fullName : receipt.snapshot?.fullName,
    paymentDate: receipt.paymentDate,
    amount: receipt.amount,
    status: "Verified",
  }, "Receipt verified");
});
