const Payment = require("../models/Payment");
const Taxpayer = require("../models/Taxpayer");
const asyncHandler = require("../utils/asyncHandler");
const { success, fail } = require("../utils/apiResponse");
const { buildSheet, buildCsv } = require("../services/excelService");
const { logAudit } = require("../services/auditService");

function dateRange(query) {
  const now = new Date();
  let from = query.from ? new Date(query.from) : null;
  let to = query.to ? new Date(query.to) : null;
  if (query.period === "daily") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  } else if (query.period === "monthly") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (query.period === "yearly") {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear() + 1, 0, 1);
  }
  return { from, to };
}

// Builds report rows depending on the requested report type.
async function buildReportRows(type, query) {
  if (type === "defaulter" || type === "pending") {
    const list = await Taxpayer.find({ totalDue: { $gt: 0 } }).sort({ totalDue: -1 });
    return list.map((t) => ({
      TaxpayerID: t.taxpayerId,
      Name: t.fullName,
      Ward: t.wardNumber,
      Mobile: t.mobileNumber,
      Email: t.email,
      TotalDue: t.totalDue,
      DueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "",
    }));
  }

  if (type === "taxpayer") {
    const list = await Taxpayer.find().sort({ createdAt: -1 });
    return list.map((t) => ({
      TaxpayerID: t.taxpayerId,
      Name: t.fullName,
      Father: t.fatherName,
      House: t.houseNumber,
      Property: t.propertyNumber,
      Ward: t.wardNumber,
      Village: t.village,
      Mobile: t.mobileNumber,
      Email: t.email,
      CurrentTax: t.currentTax,
      TotalDue: t.totalDue,
      Paid: t.paidAmount,
      Status: t.status,
    }));
  }

  if (type === "ward") {
    const agg = await Taxpayer.aggregate([
      { $group: { _id: "$wardNumber", taxpayers: { $sum: 1 }, totalDue: { $sum: "$totalDue" }, collected: { $sum: "$paidAmount" } } },
      { $sort: { _id: 1 } },
    ]);
    return agg.map((w) => ({ Ward: w._id || "Unassigned", Taxpayers: w.taxpayers, TotalDue: w.totalDue, Collected: w.collected }));
  }

  // collection reports (daily/monthly/yearly) over Payment
  const { from, to } = dateRange(query);
  const filter = { status: "paid" };
  if (from && to) filter.paymentDate = { $gte: from, $lt: to };
  const payments = await Payment.find(filter).populate("taxpayer", "fullName taxpayerId wardNumber").sort({ paymentDate: -1 });
  return payments.map((p) => ({
    Date: new Date(p.paymentDate).toLocaleString("en-IN"),
    TaxpayerID: p.taxpayer ? p.taxpayer.taxpayerId : "",
    Name: p.taxpayer ? p.taxpayer.fullName : "",
    Ward: p.taxpayer ? p.taxpayer.wardNumber : "",
    Amount: p.amount,
    Mode: p.mode,
    Type: p.type,
  }));
}

exports.getReport = asyncHandler(async (req, res) => {
  const { type = "collection", format = "json" } = req.query;
  const rows = await buildReportRows(type, req.query);

  await logAudit(req, { action: "report_generated", entity: "Report", details: { type, format } });

  if (format === "json") {
    return success(res, { rows, count: rows.length });
  }

  if (format === "csv") {
    const csv = buildCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report.csv"`);
    return res.send(csv);
  }

  if (format === "excel" || format === "xlsx") {
    const buf = buildSheet(rows, `${type}-report`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report.xlsx"`);
    return res.send(buf);
  }

  return fail(res, "Unsupported format. Use json, csv or excel.", 400);
});
