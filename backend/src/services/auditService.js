const AuditLog = require("../models/AuditLog");

function getIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    ""
  );
}

// Fire-and-forget audit logger. Never throws into the request flow.
async function logAudit(req, { action, entity, entityId, details } = {}) {
  try {
    const actor = req && req.user ? req.user : null;
    await AuditLog.create({
      actorType: req?.userRole || "system",
      actorId: actor?._id,
      actorName: actor?.name || actor?.fullName || "system",
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      details,
      ipAddress: req ? getIp(req) : undefined,
      userAgent: req?.headers?.["user-agent"],
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Audit log failed:", err.message);
  }
}

module.exports = { logAudit, getIp };
