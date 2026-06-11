const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

let cachedSmtpTransporter = null;

// Option A (local/dev): Gmail address + App Password (GMAIL_EMAIL + GMAIL_APP_PASSWORD).
// NOTE: This uses SMTP (ports 465/587). Many hosts (e.g. Render free tier)
// BLOCK outbound SMTP, which causes ETIMEDOUT / CONN errors. On those hosts
// use Option B (Gmail API over HTTPS) instead.
function usingAppPassword() {
  return Boolean(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
}

// Option B (recommended for Render/cloud): Gmail API via OAuth2.
// Sends over HTTPS (port 443), so it works even when SMTP ports are blocked.
function usingOAuth() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.GMAIL_EMAIL
  );
}

function isConfigured() {
  return usingAppPassword() || usingOAuth();
}

// ---- MIME builder (RFC 822) so we can send via the Gmail API ----
function encodeHeaderWord(value) {
  // Encode non-ASCII (e.g. Marathi) header values per RFC 2047.
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return "=?UTF-8?B?" + Buffer.from(value, "utf8").toString("base64") + "?=";
}

function chunk76(str) {
  return str.replace(/(.{76})/g, "$1\r\n");
}

function buildMimeMessage({ from, to, subject, html, text, attachments }) {
  const fromHeader = from.replace(/(.*)(<.*>)/, (m, name, addr) =>
    (name.trim() ? encodeHeaderWord(name.trim()) + " " : "") + addr
  );
  const headers = [
    "From: " + fromHeader,
    "To: " + to,
    "Subject: " + encodeHeaderWord(subject || ""),
    "MIME-Version: 1.0",
  ];

  const htmlBody = html || (text ? "<pre>" + text + "</pre>" : "");
  const list = Array.isArray(attachments) ? attachments : [];

  if (list.length === 0) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    headers.push("Content-Transfer-Encoding: base64");
    const body = chunk76(Buffer.from(htmlBody, "utf8").toString("base64"));
    return headers.join("\r\n") + "\r\n\r\n" + body;
  }

  const boundary = "gpb_" + crypto.randomBytes(12).toString("hex");
  headers.push('Content-Type: multipart/mixed; boundary="' + boundary + '"');

  let body = "--" + boundary + "\r\n";
  body += 'Content-Type: text/html; charset="UTF-8"\r\n';
  body += "Content-Transfer-Encoding: base64\r\n\r\n";
  body += chunk76(Buffer.from(htmlBody, "utf8").toString("base64")) + "\r\n";

  for (const att of list) {
    const content = Buffer.isBuffer(att.content)
      ? att.content
      : Buffer.from(att.content || "");
    const filename = att.filename || "attachment";
    const ctype = att.contentType || "application/octet-stream";
    body += "--" + boundary + "\r\n";
    body += "Content-Type: " + ctype + '; name="' + filename + '"\r\n';
    body += "Content-Transfer-Encoding: base64\r\n";
    body +=
      'Content-Disposition: attachment; filename="' + filename + '"\r\n\r\n';
    body += chunk76(content.toString("base64")) + "\r\n";
  }
  body += "--" + boundary + "--";

  return headers.join("\r\n") + "\r\n\r\n" + body;
}

function toBase64Url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---- Gmail API send over HTTPS (works on Render; no SMTP needed) ----
async function sendViaGmailApi(message) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI ||
      "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const raw = toBase64Url(buildMimeMessage(message));
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  return { id: res.data.id, api: "gmail" };
}

// ---- SMTP send via App Password (local/dev fallback) ----
function getSmtpTransporter() {
  if (!cachedSmtpTransporter) {
    cachedSmtpTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      // Fail fast instead of hanging for minutes when SMTP ports are blocked.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return cachedSmtpTransporter;
}

/**
 * Sends an email. Attachments optional ([{ filename, content<Buffer>, contentType? }]).
 * Order of preference:
 *   1. Gmail API over HTTPS (OAuth) - works on Render where SMTP is blocked.
 *   2. SMTP App Password - good for local development.
 * If email is not configured, logs to console instead of throwing.
 */
async function sendMail({ to, subject, html, text, attachments }) {
  if (!isConfigured()) {
    // eslint-disable-next-line no-console
    console.log(
      "\u2709\uFE0F [DEV EMAIL] to=" +
        to +
        ' subject="' +
        subject +
        '" (email not configured)'
    );
    return { mocked: true };
  }

  const from = "Gram Panchayat Ghirni <" + process.env.GMAIL_EMAIL + ">";
  const message = { from, to, subject, html, text, attachments };

  // Prefer the Gmail API (HTTPS) when OAuth is configured - this is the path
  // that works on Render and other hosts that block outbound SMTP.
  if (usingOAuth()) {
    return sendViaGmailApi(message);
  }

  const transporter = getSmtpTransporter();
  return transporter.sendMail({ from, to, subject, text, html, attachments });
}

// Human-readable description of the active email transport, for startup logs.
function getEmailMode() {
  if (usingOAuth()) return "Gmail API (OAuth over HTTPS)";
  if (usingAppPassword()) return "SMTP (Gmail App Password)";
  return "NOT CONFIGURED (emails will be logged to console only)";
}

module.exports = {
  sendMail,
  isConfigured,
  usingOAuth,
  usingAppPassword,
  getEmailMode,
};
