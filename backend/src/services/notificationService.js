const Notification = require("../models/Notification");
const Settings = require("../models/Settings");
const { sendMail } = require("./emailService");
const { notificationEmail } = require("./emailTemplates");

// Sends an email notification and records it in the Notification history.
async function notify(type, taxpayer, extra = {}, attachments) {
  const gp = await Settings.getGlobal();
  const { subject, html } = notificationEmail(type, taxpayer, gp, extra);

  const record = await Notification.create({
    taxpayer: taxpayer._id,
    type,
    to: taxpayer.email,
    subject,
    message: html,
    status: "pending",
  });

  try {
    if (!taxpayer.email) throw new Error("Taxpayer has no email");
    await sendMail({ to: taxpayer.email, subject, html, attachments });
    record.status = "sent";
  } catch (err) {
    record.status = "failed";
    record.error = err.message;
  }
  await record.save();
  return record;
}

module.exports = { notify };
