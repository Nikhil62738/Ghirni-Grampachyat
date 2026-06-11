const Admin = require("../models/Admin");
const asyncHandler = require("../utils/asyncHandler");
const { success, created, fail, ApiError } = require("../utils/apiResponse");
const { ALL_PERMISSIONS } = require("../config/constants");
const { logAudit } = require("../services/auditService");

exports.listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: -1 });
  return success(res, { admins, availablePermissions: ALL_PERMISSIONS });
});

exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, permissions = [], isSuperAdmin = false } = req.body;
  if (!name || !email || !password) throw new ApiError("Name, email and password are required", 400);

  const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
  if (invalid.length) throw new ApiError(`Invalid permissions: ${invalid.join(", ")}`, 400);

  const exists = await Admin.findOne({ email: String(email).toLowerCase() });
  if (exists) return fail(res, "An admin with this email already exists", 409);

  const admin = await Admin.create({
    name,
    email,
    password,
    permissions,
    isSuperAdmin: req.user.isSuperAdmin ? Boolean(isSuperAdmin) : false,
    createdBy: req.user._id,
  });

  await logAudit(req, { action: "admin_created", entity: "Admin", entityId: admin._id, details: { email } });
  const obj = admin.toObject();
  delete obj.password;
  return created(res, { admin: obj }, "Admin created");
});

exports.updateAdminPermissions = asyncHandler(async (req, res) => {
  const { permissions, isActive } = req.body;
  const admin = await Admin.findById(req.params.id);
  if (!admin) return fail(res, "Admin not found", 404);
  if (admin.isSuperAdmin && !req.user.isSuperAdmin) return fail(res, "Cannot modify a super admin", 403);

  if (Array.isArray(permissions)) {
    const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length) throw new ApiError(`Invalid permissions: ${invalid.join(", ")}`, 400);
    admin.permissions = permissions;
  }
  if (typeof isActive === "boolean") admin.isActive = isActive;
  await admin.save();

  await logAudit(req, { action: "admin_permissions_updated", entity: "Admin", entityId: admin._id });
  const obj = admin.toObject();
  delete obj.password;
  return success(res, { admin: obj }, "Admin updated");
});

exports.deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return fail(res, "Admin not found", 404);
  if (admin.isSuperAdmin) return fail(res, "Cannot delete a super admin", 403);
  if (String(admin._id) === String(req.user._id)) return fail(res, "You cannot delete your own account", 400);

  await admin.deleteOne();
  await logAudit(req, { action: "admin_deleted", entity: "Admin", entityId: req.params.id });
  return success(res, {}, "Admin deleted");
});
