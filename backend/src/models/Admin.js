const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ALL_PERMISSIONS } = require("../config/constants");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, default: "admin" },
    isSuperAdmin: { type: Boolean, default: false },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

adminSchema.methods.hasPermission = function hasPermission(permission) {
  if (this.isSuperAdmin) return true;
  return this.permissions.includes(permission);
};

module.exports = mongoose.model("Admin", adminSchema);
