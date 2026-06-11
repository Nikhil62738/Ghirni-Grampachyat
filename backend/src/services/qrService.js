const QRCode = require("qrcode");

// Returns the public verification URL for a receipt.
function verificationUrl(verificationToken) {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  return `${base}/verify/${verificationToken}`;
}

async function toDataUrl(text) {
  return QRCode.toDataURL(text, { margin: 1, width: 220 });
}

async function toBuffer(text) {
  return QRCode.toBuffer(text, { margin: 1, width: 220 });
}

module.exports = { verificationUrl, toDataUrl, toBuffer };
