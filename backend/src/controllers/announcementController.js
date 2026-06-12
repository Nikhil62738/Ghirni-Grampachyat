const Announcement = require("../models/Announcement");
const asyncHandler = require("../utils/asyncHandler");
const { success, created, fail } = require("../utils/apiResponse");
const { logAudit } = require("../services/auditService");

// ===== Public (any authenticated user): active announcements =====
exports.listPublic = asyncHandler(async (req, res) => {
  const items = await Announcement.find({ active: true })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(20);
  return success(res, { items });
});

// ===== Admin: list every announcement =====
exports.listAll = asyncHandler(async (req, res) => {
  const items = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
  return success(res, { items });
});

// ===== Admin: create =====
exports.create = asyncHandler(async (req, res) => {
  const { title, titleMr, body, bodyMr, active, pinned } = req.body;
  if (!title || !String(title).trim()) return fail(res, "Title is required", 400);
  const item = await Announcement.create({
    title: String(title).trim(),
    titleMr: titleMr || "",
    body: body || "",
    bodyMr: bodyMr || "",
    active: active !== undefined ? Boolean(active) : true,
    pinned: Boolean(pinned),
    createdByName: req.user?.name || "",
  });
  await logAudit(req, { action: "announcement_created", entity: "Announcement", entityId: item._id });
  return created(res, { announcement: item }, "Announcement created");
});

// ===== Admin: update =====
exports.update = asyncHandler(async (req, res) => {
  const item = await Announcement.findById(req.params.id);
  if (!item) return fail(res, "Announcement not found", 404);
  ["title", "titleMr", "body", "bodyMr", "active", "pinned"].forEach((f) => {
    if (req.body[f] !== undefined) item[f] = req.body[f];
  });
  await item.save();
  await logAudit(req, { action: "announcement_updated", entity: "Announcement", entityId: item._id });
  return success(res, { announcement: item }, "Announcement updated");
});

// ===== Admin: delete =====
exports.remove = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) return fail(res, "Announcement not found", 404);
  await logAudit(req, { action: "announcement_deleted", entity: "Announcement", entityId: req.params.id });
  return success(res, {}, "Announcement deleted");
});
