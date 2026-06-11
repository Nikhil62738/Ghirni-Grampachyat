import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert, inr } from "../../components/ui.jsx";

export default function Receipts() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/receipts", { params: { search, limit: 50 } });
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

  const download = async (id, receiptNumber) => {
    try {
      const res = await api.get("/receipts/" + id + "/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (receiptNumber || "receipt").replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageTitle title={t("receipts")} />
      <Alert type="error">{error}</Alert>
      <div className="mb-3 flex gap-2">
        <input
          className="input max-w-sm"
          placeholder="Search receipt number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-outline" onClick={load}>
          {t("search")}
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Taxpayer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>{r.receiptNumber}</td>
                  <td>{r.taxpayer?.fullName || "-"}</td>
                  <td>
                    {new Date(r.paymentDate || r.createdAt).toLocaleDateString(
                      "en-IN",
                    )}
                  </td>
                  <td>{inr(r.amount)}</td>
                  <td>
                    <button
                      className="text-gov underline"
                      onClick={() => download(r._id, r.receiptNumber)}
                    >
                      {t("download")} PDF
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    No receipts
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
