const Payment = require("../models/Payment");
const Taxpayer = require("../models/Taxpayer");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { TAXPAYER_STATUS } = require("../config/constants");

exports.overview = asyncHandler(async (req, res) => {
  const [
    totalTaxpayers,
    activeTaxpayers,
    defaulterCount,
    collectionAgg,
    pendingAgg,
  ] = await Promise.all([
    Taxpayer.countDocuments(),
    Taxpayer.countDocuments({ status: TAXPAYER_STATUS.ACTIVE }),
    Taxpayer.countDocuments({ totalDue: { $gt: 0 } }),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Taxpayer.aggregate([{ $group: { _id: null, pending: { $sum: "$totalDue" } } }]),
  ]);

  const online = collectionAgg.find((c) => c._id === "online")?.total || 0;
  const offline = collectionAgg.find((c) => c._id === "offline")?.total || 0;

  return success(res, {
    cards: {
      totalTaxpayers,
      activeTaxpayers,
      totalCollection: online + offline,
      pendingCollection: pendingAgg[0]?.pending || 0,
      onlineCollection: online,
      offlineCollection: offline,
      defaulterCount,
    },
  });
});

exports.charts = asyncHandler(async (req, res) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [monthly, wardWise, categoryWise, modeWise] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid", paymentDate: { $gte: yearStart } } },
      { $group: { _id: { $month: "$paymentDate" }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Taxpayer.aggregate([
      { $group: { _id: "$wardNumber", collected: { $sum: "$paidAmount" }, due: { $sum: "$totalDue" } } },
      { $sort: { _id: 1 } },
    ]),
    Taxpayer.aggregate([
      { $group: { _id: "$taxCategory", collected: { $sum: "$paidAmount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$mode", total: { $sum: "$amount" } } },
    ]),
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return success(res, {
    monthlyCollection: monthly.map((m) => ({ month: monthNames[m._id - 1], total: m.total })),
    wardWise: wardWise.map((w) => ({ ward: w._id || "Unassigned", collected: w.collected, due: w.due })),
    categoryWise: categoryWise.map((c) => ({ category: c._id || "general", collected: c.collected })),
    modeWise: modeWise.map((m) => ({ mode: m._id, total: m.total })),
  });
});
