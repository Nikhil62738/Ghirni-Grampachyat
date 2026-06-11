const { currentFinancialYear } = require("../utils/ids");

/**
 * Applies yearly tax generation rules to a taxpayer document (does not save).
 * - Carries forward any remaining due into previousBalance.
 * - Applies a penalty on the carried-forward balance.
 * - Sets the new currentTax based on settings tax rates / property type.
 * - Recomputes totalDue and updates taxHistory.
 */
function generateYearlyTax(taxpayer, settings, now = new Date()) {
  const fy = currentFinancialYear(now);
  const penaltyPct = (settings.penaltyPercentPerYear || 0) / 100;

  const carriedForward = Math.max(0, taxpayer.totalDue || 0);
  const penaltyOnCarry = Math.round(carriedForward * penaltyPct);

  const rates = settings.taxRates instanceof Map ? Object.fromEntries(settings.taxRates) : settings.taxRates || {};
  const fixed = Number(settings.fixedTaxAmount || 0);
  // When the admin has set a fixed tax amount, apply it flatly to every
  // taxpayer; otherwise fall back to the per-category tax rates.
  const newTax = fixed > 0 ? fixed : Number(rates[taxpayer.taxCategory] || rates[taxpayer.propertyType] || rates.residential || 0);

  taxpayer.previousBalance = carriedForward;
  taxpayer.penalty = (taxpayer.penalty || 0) + penaltyOnCarry;
  taxpayer.currentTax = newTax;
  taxpayer.totalDue = carriedForward + penaltyOnCarry + newTax;

  const dueDate = new Date(now.getFullYear(), (settings.dueMonth || 5) - 1, settings.dueDay || 31);
  taxpayer.dueDate = dueDate;

  taxpayer.taxHistory = taxpayer.taxHistory || [];
  taxpayer.taxHistory.push({
    financialYear: fy,
    tax: newTax,
    penalty: penaltyOnCarry,
    paid: 0,
    due: taxpayer.totalDue,
    status: "pending",
  });

  return { financialYear: fy, newTax, penaltyOnCarry, totalDue: taxpayer.totalDue };
}

/**
 * Applies a payment to a taxpayer (does not save). Reduces totalDue and updates
 * the current financial-year history entry. Returns remaining balance.
 */
function applyPayment(taxpayer, amount, now = new Date()) {
  const fy = currentFinancialYear(now);
  taxpayer.paidAmount = (taxpayer.paidAmount || 0) + amount;
  taxpayer.totalDue = Math.max(0, (taxpayer.totalDue || 0) - amount);
  taxpayer.lastPaymentDate = now;

  taxpayer.taxHistory = taxpayer.taxHistory || [];
  let entry = taxpayer.taxHistory.find((h) => h.financialYear === fy);
  if (!entry) {
    entry = { financialYear: fy, tax: taxpayer.currentTax || 0, penalty: 0, paid: 0, due: taxpayer.totalDue, status: "pending" };
    taxpayer.taxHistory.push(entry);
  }
  entry.paid = (entry.paid || 0) + amount;
  entry.due = Math.max(0, (entry.due || 0) - amount);
  entry.status = entry.due <= 0 ? "paid" : "partial";

  return taxpayer.totalDue;
}

module.exports = { generateYearlyTax, applyPayment };
