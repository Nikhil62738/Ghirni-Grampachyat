const Receipt = require("../models/Receipt");
const Settings = require("../models/Settings");
const crypto = require("crypto");
const { generateReceiptNumber } = require("../utils/ids");
const { generateReceiptPdf } = require("./pdfService");
const { verificationUrl } = require("./qrService");
const { uploadBuffer, isConfigured: cloudinaryReady } = require("./cloudinaryService");

/**
 * Creates a receipt for a payment, generates the PDF, optionally uploads to
 * Cloudinary, and returns { receipt, pdfBuffer }.
 */
async function createReceiptForPayment({ payment, taxpayer }) {
  const settings = await Settings.getGlobal();
  const receiptNumber = await generateReceiptNumber();
  const verificationToken = crypto.randomBytes(16).toString("hex");

  const receipt = await Receipt.create({
    receiptNumber,
    taxpayer: taxpayer._id,
    payment: payment._id,
    amount: payment.amount,
    mode: payment.mode,
    paymentDate: payment.paymentDate || new Date(),
    remainingBalance: taxpayer.totalDue || 0,
    verificationToken,
    snapshot: {
      fullName: taxpayer.fullName,
      fatherName: taxpayer.fatherName,
      taxpayerId: taxpayer.taxpayerId,
      houseNumber: taxpayer.houseNumber,
      propertyNumber: taxpayer.propertyNumber,
      wardNumber: taxpayer.wardNumber,
      village: taxpayer.village,
    },
  });

  const verifyUrl = verificationUrl(verificationToken);
  const pdfBuffer = await generateReceiptPdf({ receipt, taxpayer, settings, verifyUrl });

  if (cloudinaryReady()) {
    try {
      const url = await uploadBuffer(pdfBuffer, {
        publicId: receiptNumber.replace(/[^a-zA-Z0-9]/g, "_"),
        resourceType: "raw",
      });
      if (url) {
        receipt.pdfUrl = url;
        await receipt.save();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Cloudinary upload failed:", err.message);
    }
  }

  payment.receipt = receipt._id;
  await payment.save();

  return { receipt, pdfBuffer };
}

module.exports = { createReceiptForPayment };
