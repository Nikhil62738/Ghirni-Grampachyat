const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    taxpayer: { type: mongoose.Schema.Types.ObjectId, ref: "Taxpayer", required: true, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    amount: { type: Number, required: true },
    mode: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now },
    remainingBalance: { type: Number, default: 0 },

    // Verification
    verificationToken: { type: String, required: true, unique: true, index: true },
    isVerified: { type: Boolean, default: true },

    // Storage
    pdfUrl: { type: String }, // Cloudinary URL (optional)
    snapshot: { type: Object }, // frozen taxpayer + tax details for the receipt
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);
