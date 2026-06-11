const Settings = require("../models/Settings");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { logAudit } = require("../services/auditService");
const { runYearlyTaxGeneration } = require("../jobs/cronJobs");

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getGlobal();
  return success(res, { settings });
});

// ===== Manually apply the yearly tax to every taxpayer right now =====
exports.runTaxNow = asyncHandler(async (req, res) => {
  const processed = await runYearlyTaxGeneration();
  const settings = await Settings.getGlobal();
  settings.lastTaxRunYear = new Date().getFullYear();
  await settings.save();
  await logAudit(req, { action: "tax_generated_manual", entity: "System", details: { processed } });
  return success(res, { processed }, `Tax applied to ${processed} taxpayer(s)`);
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getGlobal();
  const editable = [
    "gramPanchayatName", "village", "taluka", "district", "state", "pincode",
    "contactEmail", "contactPhone", "logoUrl", "penaltyPercentPerYear", "dueMonth",
    "dueDay", "currency", "fixedTaxAmount", "taxApplyMonth", "taxApplyDay",
  ];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) settings[f] = req.body[f];
  });
  if (req.body.taxRates && typeof req.body.taxRates === "object") {
    Object.entries(req.body.taxRates).forEach(([k, v]) => settings.taxRates.set(k, Number(v)));
  }
  await settings.save();

  await logAudit(req, { action: "settings_updated", entity: "Settings" });
  return success(res, { settings }, "Settings updated");
});

// ===== Backup: export full collections as JSON =====
exports.backup = asyncHandler(async (req, res) => {
  const Taxpayer = require("../models/Taxpayer");
  const Payment = require("../models/Payment");
  const Receipt = require("../models/Receipt");
  const Admin = require("../models/Admin");

  const [taxpayers, payments, receipts, admins, settings] = await Promise.all([
    Taxpayer.find().lean(),
    Payment.find().lean(),
    Receipt.find().lean(),
    Admin.find().select("-password").lean(),
    Settings.getGlobal(),
  ]);

  await logAudit(req, { action: "backup_created", entity: "System" });
  const dump = { generatedAt: new Date(), taxpayers, payments, receipts, admins, settings };
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="gp-ghirni-backup-${Date.now()}.json"`);
  return res.send(JSON.stringify(dump, null, 2));
});
