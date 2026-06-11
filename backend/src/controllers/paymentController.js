const Payment = require("../models/Payment");
const Taxpayer = require("../models/Taxpayer");
const asyncHandler = require("../utils/asyncHandler");
const { success, created, fail, ApiError } = require("../utils/apiResponse");
const { PAYMENT_STATUS, NOTIFICATION_TYPES, ROLES } = require("../config/constants");
const { currentFinancialYear } = require("../utils/ids");
const { applyPayment } = require("../services/taxService");
const razorpay = require("../services/razorpayService");
const { createReceiptForPayment } = require("../services/receiptService");
const { notify } = require("../services/notificationService");
const { logAudit } = require("../services/auditService");

// ===== Admin: list payments =====
exports.listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Payment.find(filter).populate("taxpayer", "fullName taxpayerId wardNumber").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return success(res, { items, total, page, pages: Math.ceil(total / limit) });
});

// ===== Admin: record an offline payment =====
exports.collectOffline = asyncHandler(async (req, res) => {
  const { taxpayerId, amount, mode, remarks, paymentDate } = req.body;
  const amt = Number(amount);
  if (!taxpayerId || !amt || amt <= 0) throw new ApiError("Taxpayer and a positive amount are required", 400);
  if (!["cash", "upi", "cheque", "bank_transfer"].includes(mode)) throw new ApiError("Invalid offline payment mode", 400);

  const tp = await Taxpayer.findById(taxpayerId);
  if (!tp) return fail(res, "Taxpayer not found", 404);

  const payment = await Payment.create({
    taxpayer: tp._id,
    amount: amt,
    mode,
    type: "offline",
    status: PAYMENT_STATUS.PAID,
    remarks,
    collectedBy: req.user._id,
    collectedByName: req.user.name,
    financialYear: currentFinancialYear(),
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
  });

  applyPayment(tp, amt);
  await tp.save();

  const { receipt, pdfBuffer } = await createReceiptForPayment({ payment, taxpayer: tp });
  const attachments = pdfBuffer
    ? [{ filename: `${String(receipt.receiptNumber).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`, content: pdfBuffer }]
    : undefined;
  await notify(
    NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    tp,
    { amount: amt, receiptNumber: receipt.receiptNumber, remainingDue: tp.totalDue },
    attachments
  ).catch(() => {});
  await logAudit(req, { action: "offline_payment_collected", entity: "Payment", entityId: payment._id, details: { amount: amt, mode } });

  return created(res, { payment, receipt }, "Offline payment recorded");
});

// ===== Taxpayer: create a Razorpay order =====
exports.createOnlineOrder = asyncHandler(async (req, res) => {
  if (req.userRole !== ROLES.TAXPAYER) throw new ApiError("Taxpayer access only", 403);
  const amt = Number(req.body.amount);
  if (!amt || amt <= 0) throw new ApiError("A positive amount is required", 400);
  if (!razorpay.isConfigured()) return fail(res, "Online payments are not configured. Please contact the office.", 503);

  const tp = await Taxpayer.findById(req.user._id);
  if (!tp) return fail(res, "Record not found", 404);

  const payment = await Payment.create({
    taxpayer: tp._id,
    amount: amt,
    mode: "online",
    type: "online",
    status: PAYMENT_STATUS.CREATED,
    financialYear: currentFinancialYear(),
  });

  const order = await razorpay.createOrder(amt, String(payment._id));
  payment.razorpayOrderId = order.id;
  await payment.save();

  return created(res, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentRef: payment._id,
  }, "Order created");
});

// ===== Taxpayer: verify Razorpay payment =====
exports.verifyOnlinePayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError("Missing Razorpay verification fields", 400);
  }

  const valid = razorpay.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) return fail(res, "Payment record not found", 404);

  if (!valid) {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    return fail(res, "Payment signature verification failed", 400);
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return success(res, { payment }, "Payment already processed");
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = PAYMENT_STATUS.PAID;
  payment.paymentDate = new Date();
  await payment.save();

  const tp = await Taxpayer.findById(payment.taxpayer);
  applyPayment(tp, payment.amount);
  await tp.save();

  const { receipt, pdfBuffer } = await createReceiptForPayment({ payment, taxpayer: tp });
  const attachments = pdfBuffer
    ? [{ filename: `${String(receipt.receiptNumber).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`, content: pdfBuffer }]
    : undefined;
  await notify(
    NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    tp,
    { amount: payment.amount, receiptNumber: receipt.receiptNumber, remainingDue: tp.totalDue },
    attachments
  ).catch(() => {});
  await logAudit(req, { action: "online_payment_success", entity: "Payment", entityId: payment._id, details: { amount: payment.amount } });

  return success(res, { payment, receipt }, "Payment verified and receipt generated");
});
