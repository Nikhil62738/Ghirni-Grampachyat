import { useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Alert, inr } from "../../components/ui.jsx";

const REPORT_TYPES = [
  { value: "collection", label: "Collection (period)" },
  { value: "pending", label: "Pending Tax" },
  { value: "defaulter", label: "Defaulter" },
  { value: "ward", label: "Ward-wise" },
  { value: "taxpayer", label: "Taxpayer" },
];

export default function Reports() {
  const { t } = useI18n();
  const [type, setType] = useState("collection");
  const [period, setPeriod] = useState("monthly");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/reports", {
        params: { type, period, format: "json" },
      });
      setRows(res.data.data.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (format) => {
    setError("");
    try {
      const res = await api.get("/reports", {
        params: { type, period, format },
        responseType: "blob",
      });
      const ext = format === "excel" ? "xlsx" : format;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = type + "-report." + ext;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <PageTitle title={t("reports")} />
      <Alert type="error">{error}</Alert>

      <div className="card mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Report Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {type === "collection" && (
          <div>
            <label className="label">Period</label>
            <select
              className="input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
        <button className="btn-primary" onClick={run}>
          Generate
        </button>
        <button className="btn-outline" onClick={() => exportFile("pdf")}>
          PDF
        </button>
        <button className="btn-outline" onClick={() => exportFile("excel")}>
          Excel
        </button>
        <button className="btn-outline" onClick={() => exportFile("csv")}>
          CSV
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500">Generating...</div>
      ) : rows.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c}>{String(row[c] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Generate a report to see results.
        </p>
      )}
    </div>
  );
}
