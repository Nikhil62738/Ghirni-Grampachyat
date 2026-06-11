const Notification = require("../models/Notification");
const Taxpayer = require("../models/Taxpayer");
const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { sendMail } = require("../services/emailService");
const { reminderEmail } = require("../services/emailTemplates");
const { NOTIFICATION_TYPES } = require("../config/constants");
const { logAudit } = require("../services/auditService");

// ===== Notification history =====
exports.listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
  const [items, total] = await Promise.all([
    Notification.find().populate("taxpayer", "fullName taxpayerId").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(),
  ]);
  return success(res, { items, total, page, pages: Math.ceil(total / limit) });
});

// ===== Send reminder to all defaulters =====
exports.remindDefaulters = asyncHandler(async (req, res) => {
  const gp = await Settings.getGlobal();
  const defaulters = await Taxpayer.find({ totalDue: { $gt: 0 }, email: { $exists: true, $ne: "" } });
  const paymentLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

  let sent = 0;
  let failed = 0;
  for (const tp of defaulters) {
    const { subject, html } = reminderEmail(tp, gp, paymentLink);
    const record = await Notification.create({
      taxpayer: tp._id,
      type: NOTIFICATION_TYPES.DUE_REMINDER,
      to: tp.email,
      subject,
      message: html,
      status: "pending",
    });
    try {
      await sendMail({ to: tp.email, subject, html });
      record.status = "sent";
      sent += 1;
    } catch (err) {
      record.status = "failed";
      record.error = err.message;
      failed += 1;
    }
    await record.save();
  }

  await logAudit(req, { action: "reminders_sent", entity: "Notification", details: { sent, failed } });
  return success(res, { totalDefaulters: defaulters.length, sent, failed }, "Reminders processed");
});
