import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert, inr } from "../../components/ui.jsx";

export default function Payments() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/payments", { params: { limit: 50 } });
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
      <PageTitle title={t("payments")} />
      <Alert type="error">{error}</Alert>
      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Taxpayer</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    {new Date(p.paymentDate || p.createdAt).toLocaleString(
                      "en-IN",
                    )}
                  </td>
                  <td>{p.taxpayer?.fullName || "-"}</td>
                  <td>{inr(p.amount)}</td>
                  <td>{p.mode}</td>
                  <td>{p.type}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400">
                    No payments
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
