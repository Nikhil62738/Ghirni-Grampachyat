const crypto = require("crypto");
let Razorpay = null;
try {
  // eslint-disable-next-line global-require
  Razorpay = require("razorpay");
} catch (e) {
  Razorpay = null;
}

function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  if (!isConfigured()) throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  if (!Razorpay) throw new Error("razorpay package not installed. Run npm install.");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// amount is in rupees; Razorpay expects paise.
async function createOrder(amountInRupees, receiptId) {
  const instance = getClient();
  return instance.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: "INR",
    receipt: receiptId,
    payment_capture: 1,
  });
}

// Verifies the signature returned by Razorpay Checkout.
function verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === razorpaySignature;
}

module.exports = { isConfigured, createOrder, verifySignature };
