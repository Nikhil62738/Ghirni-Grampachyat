const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

exports.listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const filter = {};
  if (req.query.action) filter.action = new RegExp(String(req.query.action), "i");
  if (req.query.actorType) filter.actorType = req.query.actorType;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return success(res, { items, total, page, pages: Math.ceil(total / limit) });
});
