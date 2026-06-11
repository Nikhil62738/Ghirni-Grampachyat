import { useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Alert, StatCard } from "../../components/ui.jsx";

export default function BulkUpload() {
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!file) return setError("Please choose an Excel or CSV file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/taxpayers/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageTitle
        title={t("bulkUpload")}
        subtitle="Columns: Name, Father's Name, House Number, Property Number, Ward Number, Village, Mobile Number, Email, Address, Tax Amount"
      />
      <Alert type="error">{error}</Alert>

      <form
        onSubmit={submit}
        className="card mb-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="label">Excel / CSV File</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Importing..." : "Upload & Import"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total Records"
              value={result.total}
              accent="bg-gov"
            />
            <StatCard
              label="Successful Imports"
              value={result.success}
              accent="bg-india"
            />
            <StatCard
              label="Failed Records"
              value={result.failed}
              accent="bg-red-500"
            />
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="mb-2 font-semibold">Errors</h3>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((er, i) => (
                    <tr key={i}>
                      <td>{er.row}</td>
                      <td>{er.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
