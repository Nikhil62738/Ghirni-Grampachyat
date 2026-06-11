const { NOTIFICATION_TYPES } = require("../config/constants");

const inr = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

function wrapper(title, bodyHtml, gp) {
  const name = (gp && gp.gramPanchayatName) || "Gram Panchayat Ghirni";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <div style="background:#1e3a8a;color:#fff;padding:16px 20px">
      <div style="font-size:12px;letter-spacing:1px;opacity:.85">MAHARASHTRA GOVERNMENT</div>
      <div style="font-size:18px;font-weight:bold">${name}</div>
      <div style="font-size:12px;opacity:.85">Tq. Malkapur, Dist. Buldhana - 443102</div>
    </div>
    <div style="padding:20px;color:#1f2937">
      <h2 style="margin-top:0;color:#1e3a8a">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background:#f1f5f9;padding:12px 20px;font-size:11px;color:#64748b">
      This is an automated message from ${name}. Please do not reply.
    </div>
  </div>`;
}

function otpEmail(taxpayer, code, gp) {
  return {
    subject: "Your Account Activation OTP",
    html: wrapper(
      "Account Activation",
      `<p>Dear ${taxpayer.fullName},</p>
       <p>Use the following One-Time Password (OTP) to activate your taxpayer account:</p>
       <div style="font-size:30px;font-weight:bold;letter-spacing:6px;color:#1e3a8a;text-align:center;margin:20px 0">${code}</div>
       <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>`,
      gp
    ),
  };
}

function reminderEmail(taxpayer, gp, paymentLink) {
  return {
    subject: "Property Tax Due Reminder",
    html: wrapper(
      "Tax Due Reminder",
      `<p>Dear ${taxpayer.fullName},</p>
       <p>Our records show an outstanding property tax amount.</p>
       <table style="width:100%;border-collapse:collapse;margin:12px 0">
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Taxpayer ID</td><td style="padding:6px;border:1px solid #e2e8f0">${taxpayer.taxpayerId}</td></tr>
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Total Due</td><td style="padding:6px;border:1px solid #e2e8f0"><b>${inr(taxpayer.totalDue)}</b></td></tr>
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Due Date</td><td style="padding:6px;border:1px solid #e2e8f0">${taxpayer.dueDate ? new Date(taxpayer.dueDate).toLocaleDateString("en-IN") : "-"}</td></tr>
       </table>
       ${paymentLink ? `<p><a href="${paymentLink}" style="background:#1e3a8a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Pay Now</a></p>` : ""}
       <p>Kindly clear your dues at the earliest to avoid penalty.</p>`,
      gp
    ),
  };
}

function notificationEmail(type, taxpayer, gp, extra = {}) {
  const map = {
    [NOTIFICATION_TYPES.ACCOUNT_ACTIVATED]: {
      subject: "Account Activated Successfully",
      body: `<p>Dear ${taxpayer.fullName}, your taxpayer account has been activated. You can now log in to view and pay your taxes.</p>`,
    },
    [NOTIFICATION_TYPES.TAX_GENERATED]: {
      subject: "New Tax Generated",
      body: `<p>Dear ${taxpayer.fullName}, your tax for the new financial year has been generated. Total Due: <b>${inr(taxpayer.totalDue)}</b>.</p>`,
    },
    [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: {
      subject: "Payment Received",
      body: `<p>Dear ${taxpayer.fullName}, we have received your payment of <b>${inr(extra.amount)}</b>.</p>
       <table style="width:100%;border-collapse:collapse;margin:12px 0">
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Receipt No</td><td style="padding:6px;border:1px solid #e2e8f0"><b>${extra.receiptNumber || "-"}</b></td></tr>
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Amount Paid</td><td style="padding:6px;border:1px solid #e2e8f0">${inr(extra.amount)}</td></tr>
         <tr><td style="padding:6px;border:1px solid #e2e8f0">Remaining Due</td><td style="padding:6px;border:1px solid #e2e8f0"><b>${inr(extra.remainingDue)}</b></td></tr>
       </table>
       <p>Your official receipt is attached to this email as a PDF.</p>`,
    },
    [NOTIFICATION_TYPES.RECEIPT_GENERATED]: {
      subject: "Payment Receipt",
      body: `<p>Dear ${taxpayer.fullName}, your receipt <b>${extra.receiptNumber || ""}</b> is attached / available in your dashboard.</p>`,
    },
    [NOTIFICATION_TYPES.DUE_REMINDER]: {
      subject: "Tax Due Reminder",
      body: `<p>Dear ${taxpayer.fullName}, you have an outstanding due of <b>${inr(taxpayer.totalDue)}</b>.</p>`,
    },
    [NOTIFICATION_TYPES.PENALTY_APPLIED]: {
      subject: "Penalty Applied",
      body: `<p>Dear ${taxpayer.fullName}, a penalty of <b>${inr(extra.penalty)}</b> has been applied to your account.</p>`,
    },
  };
  const tpl = map[type] || { subject: "Notification", body: "<p>Update from Gram Panchayat Ghirni.</p>" };
  return { subject: tpl.subject, html: wrapper(tpl.subject, tpl.body, gp) };
}

module.exports = { otpEmail, reminderEmail, notificationEmail, inr };
