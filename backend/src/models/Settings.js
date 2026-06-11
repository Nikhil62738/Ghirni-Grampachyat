const mongoose = require("mongoose");

// Single-document settings store for the Gram Panchayat.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },

    // Village / GP information
    gramPanchayatName: { type: String, default: "Gram Panchayat Ghirni" },
    village: { type: String, default: "Ghirni" },
    taluka: { type: String, default: "Malkapur" },
    district: { type: String, default: "Buldhana" },
    state: { type: String, default: "Maharashtra" },
    pincode: { type: String, default: "443102" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    logoUrl: { type: String, default: "" },

    // Tax + penalty rules
    taxRates: {
      type: Map,
      of: Number,
      default: { residential: 500, commercial: 1500, agricultural: 300, industrial: 2500, other: 500 },
    },
    penaltyPercentPerYear: { type: Number, default: 10 },
    dueMonth: { type: Number, default: 5 }, // due date month (0-indexed? we use 1-12). 5 = May
    dueDay: { type: Number, default: 31 },

    // Fixed yearly tax applied to every taxpayer on a fixed date (set by admin).
    // When fixedTaxAmount > 0 this flat amount is used for all taxpayers instead
    // of the per-category taxRates above.
    fixedTaxAmount: { type: Number, default: 0 },
    taxApplyMonth: { type: Number, default: 4 }, // month (1-12) tax is applied. 4 = April
    taxApplyDay: { type: Number, default: 1 },
    lastTaxRunYear: { type: Number, default: 0 }, // guard so it auto-runs once per year

    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

settingsSchema.statics.getGlobal = async function getGlobal() {
  let doc = await this.findOne({ key: "global" });
  if (!doc) doc = await this.create({ key: "global" });
  return doc;
};

module.exports = mongoose.model("Settings", settingsSchema);
