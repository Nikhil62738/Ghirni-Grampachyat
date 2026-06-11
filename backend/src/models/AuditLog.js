const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ["admin", "taxpayer", "system"], default: "system" },
    actorId: { type: mongoose.Schema.Types.ObjectId },
    actorName: { type: String },
    action: { type: String, required: true },
    entity: { type: String },
    entityId: { type: String },
    details: { type: Object },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
