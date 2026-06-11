const cron = require("node-cron");
const Taxpayer = require("../models/Taxpayer");
const Settings = require("../models/Settings");
const { generateYearlyTax } = require("../services/taxService");
const { notify } = require("../services/notificationService");
const { NOTIFICATION_TYPES } = require("../config/constants");

/**
 * Runs the yearly tax generation for every taxpayer.
 * Exposed so it can also be triggered manually / tested.
 */
async function runYearlyTaxGeneration() {
  const settings = await Settings.getGlobal();
  const cursor = Taxpayer.find().cursor();
  let processed = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (let tp = await cursor.next(); tp != null; tp = await cursor.next()) {
    try {
      generateYearlyTax(tp, settings);
      await tp.save();
      processed += 1;
      notify(NOTIFICATION_TYPES.TAX_GENERATED, tp).catch(() => {});
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Yearly tax failed for ${tp.taxpayerId}:`, err.message);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`\u2705 Yearly tax generation complete. Processed ${processed} taxpayers.`);
  return processed;
}

/**
 * Checks whether today matches the admin-configured tax-apply date and, if so,
 * applies the yearly tax to every taxpayer. Guarded by lastTaxRunYear so it only
 * runs once per calendar year even though the check runs daily.
 */
async function checkAndRunYearlyTax(now = new Date()) {
  const settings = await Settings.getGlobal();
  const month = settings.taxApplyMonth || 4;
  const day = settings.taxApplyDay || 1;
  const year = now.getFullYear();

  if (now.getMonth() + 1 === month && now.getDate() === day && settings.lastTaxRunYear !== year) {
    // eslint-disable-next-line no-console
    console.log("\u23F0 Tax-apply date reached. Running yearly tax generation...");
    const processed = await runYearlyTaxGeneration();
    settings.lastTaxRunYear = year;
    await settings.save();
    return processed;
  }
  return 0;
}

function initCronJobs() {
  // Run every day at 00:05 IST and apply the yearly tax when today matches the
  // admin-configured apply date (Settings.taxApplyMonth / taxApplyDay).
  // Cron format: minute hour day month weekday
  cron.schedule(
    "5 0 * * *",
    () => {
      checkAndRunYearlyTax().catch((e) => console.error(e));
    },
    { timezone: "Asia/Kolkata" }
  );

  // eslint-disable-next-line no-console
  console.log("\u2705 Cron jobs initialized (daily tax-date check at 00:05 IST)");
}

module.exports = { initCronJobs, runYearlyTaxGeneration, checkAndRunYearlyTax };
