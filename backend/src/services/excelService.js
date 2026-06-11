const XLSX = require("xlsx");

// Maps various human-friendly header names to our canonical fields.
const HEADER_MAP = {
  name: "fullName",
  fullname: "fullName",
  "full name": "fullName",
  "father's name": "fatherName",
  "fathers name": "fatherName",
  fathername: "fatherName",
  "house number": "houseNumber",
  housenumber: "houseNumber",
  "property number": "propertyNumber",
  propertynumber: "propertyNumber",
  "ward number": "wardNumber",
  wardnumber: "wardNumber",
  ward: "wardNumber",
  village: "village",
  "mobile number": "mobileNumber",
  mobile: "mobileNumber",
  phone: "mobileNumber",
  email: "email",
  address: "address",
  "tax amount": "taxAmount",
  taxamount: "taxAmount",
  tax: "taxAmount",
  "property type": "propertyType",
  "tax category": "taxCategory",
  aadhaar: "aadhaarLast4",
  "aadhaar last 4 digits": "aadhaarLast4",
};

function normalizeRow(raw) {
  const out = {};
  Object.keys(raw).forEach((key) => {
    const canonical = HEADER_MAP[String(key).trim().toLowerCase()];
    if (canonical) out[canonical] = typeof raw[key] === "string" ? raw[key].trim() : raw[key];
  });
  return out;
}

// Parses an uploaded Excel/CSV buffer into normalized row objects.
function parseTaxpayerSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows.map(normalizeRow);
}

// Builds an XLSX buffer from an array of plain objects (for report export).
function buildSheet(rows, sheetName = "Report") {
  const ws = XLSX.utils.json_to_sheet(rows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Builds a CSV string from rows.
function buildCsv(rows) {
  const ws = XLSX.utils.json_to_sheet(rows || []);
  return XLSX.utils.sheet_to_csv(ws);
}

module.exports = { parseTaxpayerSheet, buildSheet, buildCsv };
