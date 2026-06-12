import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const MENU = [
  { to: "/admin", key: "dashboard", end: true, perm: null },
  { to: "/admin/taxpayers", key: "taxpayers", perm: "manage_taxpayers" },
  { to: "/admin/taxpayers/add", key: "addTaxpayer", perm: "manage_taxpayers" },
  { to: "/admin/bulk-upload", key: "bulkUpload", perm: "manage_taxpayers" },
  { to: "/admin/payments", key: "payments", perm: "manage_payments" },
  {
    to: "/admin/offline-collection",
    key: "offlineCollection",
    perm: "manage_payments",
  },
  { to: "/admin/receipts", key: "receipts", perm: "manage_receipts" },
  {
    to: "/admin/notifications",
    key: "notifications",
    perm: "manage_notifications",
  },
  {
    to: "/admin/announcements",
    key: "announcements",
    perm: "manage_notifications",
  },
  { to: "/admin/reports", key: "reports", perm: "manage_reports" },
  { to: "/admin/analytics", key: "analytics", perm: "manage_analytics" },
  { to: "/admin/admins", key: "adminManagement", perm: "manage_admins" },
  { to: "/admin/audit-logs", key: "auditLogs", perm: null },
  { to: "/admin/settings", key: "settings", perm: "manage_settings" },
];

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleMenu = MENU.filter((m) => !m.perm || hasPermission(m.perm));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-gov px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            \u2630
          </button>
          <span className="font-semibold">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "mr" : "en")}
            className="rounded border border-white/40 px-2 py-1"
          >
            {lang === "en" ? "\u092E\u0930\u093E\u0920\u0940" : "EN"}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded border border-white/40 px-2 py-1"
          >
            {dark ? "\u2600\uFE0F" : "\u{1F319}"}
          </button>
          <span className="hidden sm:inline">{user?.name}</span>
          <button
            type="button"
            onClick={doLogout}
            className="rounded bg-white/15 px-3 py-1 hover:bg-white/25"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={
            "w-60 shrink-0 border-r bg-white p-3 dark:border-slate-700 dark:bg-slate-800 md:block " +
            (open ? "block" : "hidden")
          }
        >
          <nav className="space-y-1">
            {visibleMenu.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                end={m.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  "block rounded px-3 py-2 text-sm " +
                  (isActive
                    ? "bg-gov text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700")
                }
              >
                {t(m.key)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-56px)] flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
