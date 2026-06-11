// Run with: npm run seed
// Creates a super admin (with all permissions) and a default Settings doc.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Admin = require("../models/Admin");
const Settings = require("../models/Settings");
const { ALL_PERMISSIONS } = require("../config/constants");

async function seed() {
  await connectDB();

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@ghirni.gov.in").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";

  let admin = await Admin.findOne({ email });
  if (admin) {
    // eslint-disable-next-line no-console
    console.log(`\u2139\uFE0F Super admin already exists: ${email}`);
  } else {
    admin = await Admin.create({
      name,
      email,
      password,
      isSuperAdmin: true,
      permissions: ALL_PERMISSIONS,
    });
    // eslint-disable-next-line no-console
    console.log(`\u2705 Super admin created: ${email} / ${password}`);
  }

  await Settings.getGlobal();
  // eslint-disable-next-line no-console
  console.log("\u2705 Settings document ensured");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("\u274C Seed failed:", err);
  process.exit(1);
});
