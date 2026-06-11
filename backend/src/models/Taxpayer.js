const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { TAXPAYER_STATUS } = require("../config/constants");

const taxHistorySchema = new mongoose.Schema(
  {
    financialYear: { type: String, required: true }, // e.g. "2025-2026"
    tax: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    status: { type: String, enum: ["paid", "partial", "pending"], default: "pending" },
  },
  { _id: false }
);

const taxpayerSchema = new mongoose.Schema(
  {
    taxpayerId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    houseNumber: { type: String, trim: true, index: true },
    propertyNumber: { type: String, trim: true, index: true },
    wardNumber: { type: String, trim: true, index: true },
    village: { type: String, default: "Ghirni", trim: true },
    mobileNumber: { type: String, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    aadhaarLast4: { type: String, trim: true, maxlength: 4 },
    address: { type: String, trim: true },
    propertyType: {
      type: String,
      enum: ["residential", "commercial", "agricultural", "industrial", "other"],
      default: "residential",
    },
    taxCategory: { type: String, default: "general", trim: true },

    // Financial fields
    currentTax: { type: Number, default: 0, min: 0 },
    previousBalance: { type: Number, default: 0, min: 0 },
    penalty: { type: Number, default: 0, min: 0 },
    totalDue: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    lastPaymentDate: { type: Date },

    taxHistory: { type: [taxHistorySchema], default: [] },

    // Account / auth
    status: { type: String, enum: Object.values(TAXPAYER_STATUS), default: TAXPAYER_STATUS.PENDING },
    password: { type: String, select: false },
    isActivated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Remaining amount is computed (totalDue already accounts for paid in our flow).
taxpayerSchema.virtual("remainingAmount").get(function remaining() {
  return Math.max(0, (this.totalDue || 0));
});

taxpayerSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

taxpayerSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// Recompute total due from components.
taxpayerSchema.methods.recomputeDue = function recomputeDue() {
  const gross = (this.currentTax || 0) + (this.previousBalance || 0) + (this.penalty || 0);
  this.totalDue = Math.max(0, gross - 0);
  return this.totalDue;
};

taxpayerSchema.set("toJSON", { virtuals: true });
taxpayerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Taxpayer", taxpayerSchema);
