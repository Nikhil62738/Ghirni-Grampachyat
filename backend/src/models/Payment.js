const mongoose = require("mongoose");
const { PAYMENT_MODES, PAYMENT_STATUS } = require("../config/constants");

const paymentSchema = new mongoose.Schema(
  {
    taxpayer: { type: mongoose.Schema.Types.ObjectId, ref: "Taxpayer", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    mode: { type: String, enum: PAYMENT_MODES, required: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.CREATED },
    type: { type: String, enum: ["online", "offline"], required: true },

    // Razorpay fields (online)
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Offline fields
    remarks: { type: String, trim: true },
    collectedByName: { type: String, trim: true },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    financialYear: { type: String },
    paymentDate: { type: Date, default: Date.now },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: "Receipt" },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
