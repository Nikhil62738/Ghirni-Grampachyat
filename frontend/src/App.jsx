import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import ActivatePage from "./pages/ActivatePage.jsx";
import VerifyReceiptPage from "./pages/VerifyReceiptPage.jsx";
import TaxpayerDashboard from "./pages/taxpayer/TaxpayerDashboard.jsx";

import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Taxpayers from "./pages/admin/Taxpayers.jsx";
import AddTaxpayer from "./pages/admin/AddTaxpayer.jsx";
import BulkUpload from "./pages/admin/BulkUpload.jsx";
import Payments from "./pages/admin/Payments.jsx";
import OfflineCollection from "./pages/admin/OfflineCollection.jsx";
import Receipts from "./pages/admin/Receipts.jsx";
import Notifications from "./pages/admin/Notifications.jsx";
import Reports from "./pages/admin/Reports.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import AdminManagement from "./pages/admin/AdminManagement.jsx";
import AuditLogs from "./pages/admin/AuditLogs.jsx";
import Settings from "./pages/admin/Settings.jsx";

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={user.role === "admin" ? "/admin" : "/portal"}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/verify/:token" element={<VerifyReceiptPage />} />

      <Route
        path="/portal"
        element={
          <Protected role="taxpayer">
            <TaxpayerDashboard />
          </Protected>
        }
      />

      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="taxpayers" element={<Taxpayers />} />
        <Route path="taxpayers/add" element={<AddTaxpayer />} />
        <Route path="taxpayers/:id/edit" element={<AddTaxpayer />} />
        <Route path="bulk-upload" element={<BulkUpload />} />
        <Route path="payments" element={<Payments />} />
        <Route path="offline-collection" element={<OfflineCollection />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
