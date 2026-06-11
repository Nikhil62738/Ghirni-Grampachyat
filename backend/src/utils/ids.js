const Counter = require("../models/Counter");

function currentFinancialYear(date = new Date()) {
  // Indian financial year: April 1 - March 31
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

async function generateTaxpayerId() {
  const seq = await Counter.next("taxpayer");
  const padded = String(seq).padStart(6, "0");
  return `GPG-TP-${padded}`;
}

async function generateReceiptNumber() {
  const fy = currentFinancialYear().replace("-", "");
  const seq = await Counter.next(`receipt-${fy}`);
  const padded = String(seq).padStart(6, "0");
  return `GPG/${fy}/${padded}`;
}

module.exports = { currentFinancialYear, generateTaxpayerId, generateReceiptNumber };
