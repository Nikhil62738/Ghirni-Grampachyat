// Idempotent seeding used automatically on server startup.
// Assumes a live Mongoose connection (call AFTER connectDB()).
// Creates the super admin only if it does not already exist, and ensures
// the global Settings document is present. Safe to run on every boot.
const Admin = require("../models/Admin");
const Settings = require("../models/Settings");
const { ALL_PERMISSIONS } = require("../config/constants");

async function ensureSeedData() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@ghirni.gov.in").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";

  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({
      name,
      email,
      password,
      isSuperAdmin: true,
      permissions: ALL_PERMISSIONS,
    });
    // eslint-disable-next-line no-console
    console.log(`\u2705 Super admin created: ${email} / ${password}`);
  }

  // Ensure the global settings document exists.
  await Settings.getGlobal();
}

module.exports = ensureSeedData;
