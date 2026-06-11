// Central place for role + permission definitions used across the app.

const ROLES = {
  ADMIN: "admin",
  TAXPAYER: "taxpayer",
};

// Granular admin permissions. A super admin has all of them.
const PERMISSIONS = {
  MANAGE_TAXPAYERS: "manage_taxpayers",
  MANAGE_PAYMENTS: "manage_payments",
  MANAGE_REPORTS: "manage_reports",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  MANAGE_RECEIPTS: "manage_receipts",
  MANAGE_ANALYTICS: "manage_analytics",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ADMINS: "manage_admins",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const TAXPAYER_STATUS = {
  PENDING: "pending", // imported, not yet activated
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const PAYMENT_MODES = ["cash", "upi", "cheque", "bank_transfer", "online"];

const PAYMENT_STATUS = {
  CREATED: "created",
  PAID: "paid",
  FAILED: "failed",
};

const NOTIFICATION_TYPES = {
  ACCOUNT_ACTIVATED: "account_activated",
  TAX_GENERATED: "tax_generated",
  PAYMENT_SUCCESS: "payment_success",
  RECEIPT_GENERATED: "receipt_generated",
  DUE_REMINDER: "due_reminder",
  PENALTY_APPLIED: "penalty_applied",
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  TAXPAYER_STATUS,
  PAYMENT_MODES,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
};
