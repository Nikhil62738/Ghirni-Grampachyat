const Taxpayer = require("../models/Taxpayer");
const asyncHandler = require("../utils/asyncHandler");
const { success, fail } = require("../utils/apiResponse");
const { parseTaxpayerSheet } = require("../services/excelService");
const { generateTaxpayerId } = require("../utils/ids");
const { logAudit } = require("../services/auditService");

const REQUIRED = ["fullName"];

exports.importTaxpayers = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) return fail(res, "No file uploaded", 400);

  let rows;
  try {
    rows = parseTaxpayerSheet(req.file.buffer);
  } catch (err) {
    return fail(res, `Could not parse file: ${err.message}`, 400);
  }

  const result = { total: rows.length, success: 0, failed: 0, duplicates: 0, errors: [] };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNo = i + 2; // header is row 1
    try {
      const missing = REQUIRED.filter((f) => !row[f]);
      if (missing.length) {
        result.failed += 1;
        result.errors.push({ row: rowNo, message: `Missing: ${missing.join(", ")}` });
        continue;
      }

      // Duplicate detection by email or mobile
      if (row.email || row.mobileNumber) {
        const dupQuery = [];
        if (row.email) dupQuery.push({ email: String(row.email).toLowerCase() });
        if (row.mobileNumber) dupQuery.push({ mobileNumber: String(row.mobileNumber) });
        const existing = dupQuery.length ? await Taxpayer.findOne({ $or: dupQuery }) : null;
        if (existing) {
          result.duplicates += 1;
          result.failed += 1;
          result.errors.push({ row: rowNo, message: "Duplicate (email/mobile already exists)" });
          continue;
        }
      }

      const taxAmount = Number(row.taxAmount || 0);
      const tp = new Taxpayer({
        taxpayerId: await generateTaxpayerId(),
        fullName: row.fullName,
        fatherName: row.fatherName,
        houseNumber: row.houseNumber,
        propertyNumber: row.propertyNumber,
        wardNumber: row.wardNumber ? String(row.wardNumber) : undefined,
        village: row.village || "Ghirni",
        mobileNumber: row.mobileNumber ? String(row.mobileNumber) : undefined,
        email: row.email ? String(row.email).toLowerCase() : undefined,
        address: row.address,
        aadhaarLast4: row.aadhaarLast4 ? String(row.aadhaarLast4).slice(-4) : undefined,
        propertyType: row.propertyType,
        taxCategory: row.taxCategory,
        currentTax: Number.isFinite(taxAmount) ? taxAmount : 0,
      });
      tp.recomputeDue();
      await tp.save();
      result.success += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: rowNo, message: err.message });
    }
  }

  await logAudit(req, { action: "taxpayers_bulk_import", entity: "Taxpayer", details: { total: result.total, success: result.success } });
  return success(res, result, "Import complete");
});
