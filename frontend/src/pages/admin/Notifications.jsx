import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

export default function Notifications() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit: 50 } });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remind = async () => {
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await api.post("/notifications/remind-defaulters");
      const d = res.data.data;
      setMsg(
        `Reminders processed: ${d.sent} sent, ${d.failed} failed of ${d.totalDefaulters} defaulters.`,
      );
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendBtn = (
    <button className="btn-primary" onClick={remind} disabled={busy}>
      {busy ? "Sending..." : t("sendReminders")}
    </button>
  );

  return (
    <div>
      <PageTitle title={t("notifications")} action={sendBtn} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>
      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n._id}>
                  <td>{new Date(n.createdAt).toLocaleString("en-IN")}</td>
                  <td>{n.type}</td>
                  <td>{n.to}</td>
                  <td>{n.subject}</td>
                  <td>{n.status}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    No notifications
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
