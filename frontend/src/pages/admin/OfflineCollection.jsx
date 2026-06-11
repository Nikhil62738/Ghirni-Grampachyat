import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Alert, inr } from "../../components/ui.jsx";

export default function OfflineCollection() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const search = async () => {
    setError("");
    try {
      const res = await api.get("/taxpayers", {
        params: { search: query, limit: 10 },
      });
      setResults(res.data.data.items);
    } catch (err) {
      setError(err.message);
    }
  };

  const collect = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setReceipt(null);
    if (!selected) return setError("Select a taxpayer first");
    setBusy(true);
    try {
      const res = await api.post("/payments/offline", {
        taxpayerId: selected._id,
        amount: Number(amount),
        mode,
        remarks,
      });
      setReceipt(res.data.data.receipt);
      setMsg(
        "Payment recorded successfully. Receipt " +
          res.data.data.receipt.receiptNumber +
          " generated.",
      );
      setAmount("");
      setRemarks("");
      setSelected(null);
      setResults([]);
      setQuery("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadReceipt = async () => {
    if (!receipt) return;
    try {
      const res = await api.get("/receipts/" + receipt._id + "/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (receipt.receiptNumber || "receipt").replace(/[^a-zA-Z0-9]/g, "_") +
        ".pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageTitle title={t("offlineCollection")} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>

      {receipt && (
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-india">
          <div>
            <div className="text-xs text-slate-400">Receipt Generated</div>
            <div className="font-semibold">{receipt.receiptNumber}</div>
            <div className="text-sm text-slate-500">
              Amount {inr(receipt.amount)} &middot; Remaining{" "}
              {inr(receipt.remainingBalance)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={downloadReceipt}
            >
              {t("download")} PDF
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setReceipt(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <label className="label">Find Taxpayer</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name / Mobile / House / Property"
          />
          <button type="button" className="btn-outline" onClick={search}>
            {t("search")}
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-2 divide-y">
            {results.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>
                  {r.fullName} ({r.taxpayerId}) - Due {inr(r.totalDue)}
                </span>
                <button
                  type="button"
                  className="text-gov underline"
                  onClick={() => setSelected(r)}
                >
                  Select
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <form
          onSubmit={collect}
          className="card grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <div className="md:col-span-2 rounded bg-slate-50 p-2 text-sm dark:bg-slate-700">
            Collecting for <b>{selected.fullName}</b> ({selected.taxpayerId}) -
            Total Due {inr(selected.totalDue)}
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Mode</label>
            <select
              className="input"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Remarks</label>
            <input
              className="input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Collect Payment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
