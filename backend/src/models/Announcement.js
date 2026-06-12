const mongoose = require("mongoose");

// Admin-managed announcements / notices shown to taxpayers in the
// web portal and the mobile app. Supports English + Marathi text.
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleMr: { type: String, default: "", trim: true },
    body: { type: String, default: "", trim: true },
    bodyMr: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true }
);

announcementSchema.index({ active: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
