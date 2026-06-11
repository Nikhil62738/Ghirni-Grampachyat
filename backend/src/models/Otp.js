const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema(
  {
    taxpayer: { type: mongoose.Schema.Types.ObjectId, ref: "Taxpayer", required: true, index: true },
    email: { type: String, required: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, default: "activation" },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: documents auto-delete once expired.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.statics.hashCode = function hashCode(code) {
  return bcrypt.hash(code, 8);
};

otpSchema.methods.verifyCode = function verifyCode(code) {
  return bcrypt.compare(code, this.codeHash);
};

module.exports = mongoose.model("Otp", otpSchema);
