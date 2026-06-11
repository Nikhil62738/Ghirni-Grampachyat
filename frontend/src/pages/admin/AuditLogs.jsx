import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

export default function AuditLogs() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/audit-logs", { params: { limit: 100 } });
        setItems(res.data.data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageTitle title={t("auditLogs")} />
      <Alert type="error">{error}</Alert>
      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  <td>{log.actorName || log.actorType}</td>
                  <td>{log.action}</td>
                  <td>{log.entity || "-"}</td>
                  <td>{log.ipAddress || "-"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    No audit logs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
