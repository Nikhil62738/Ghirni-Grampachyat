const mongoose = require("mongoose");
const { NOTIFICATION_TYPES } = require("../config/constants");

const notificationSchema = new mongoose.Schema(
  {
    taxpayer: { type: mongoose.Schema.Types.ObjectId, ref: "Taxpayer", index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    channel: { type: String, default: "email" },
    to: { type: String },
    subject: { type: String },
    message: { type: String },
    status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
    error: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
