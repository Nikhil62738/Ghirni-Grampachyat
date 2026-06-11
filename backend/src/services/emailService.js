const nodemailer = require("nodemailer");
const { google } = require("googleapis");

let cachedTransporter = null;

// Option A (simplest): Gmail address + App Password (GMAIL_EMAIL + GMAIL_APP_PASSWORD)
function usingAppPassword() {
  return Boolean(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD);
}

// Option B: Gmail API via OAuth2 (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN + GMAIL_EMAIL)
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

// Builds a Nodemailer transport. Prefers the simple App Password method when
// available, otherwise falls back to the Gmail API OAuth2 method.
async function getTransporter() {
  if (usingAppPassword()) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }
    return cachedTransporter;
  }

  if (!usingOAuth()) {
    throw new Error(
      "Email is not configured. Set GMAIL_EMAIL + GMAIL_APP_PASSWORD, or the GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN OAuth2 vars."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  const { token } = await oauth2Client.getAccessToken();

  // Rebuild each time so a freshly refreshed access token is always used.
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_EMAIL,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: token || undefined,
    },
  });
}

/**
 * Sends an email. Attachments optional.
 * If email is not configured, logs to console instead of throwing so the rest
 * of the request can still succeed (the caller decides whether to require it).
 */
async function sendMail({ to, subject, html, text, attachments }) {
  if (!isConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`\u2709\uFE0F [DEV EMAIL] to=${to} subject="${subject}" (email not configured)`);
    return { mocked: true };
  }

  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: `Gram Panchayat Ghirni <${process.env.GMAIL_EMAIL}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
  return info;
}

module.exports = { sendMail, isConfigured };
