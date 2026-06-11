import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import GovHeader from "../components/GovHeader.jsx";
import { Alert, Spinner, inr } from "../components/ui.jsx";

export default function VerifyReceiptPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get("/receipts/verify/" + token);
        if (active) setData(res.data.data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen">
      <GovHeader />
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="card text-center">
          <h2 className="mb-4 text-lg font-bold">Receipt Verification</h2>
          {loading && <Spinner />}
          {error && <Alert type="error">{error}</Alert>}
          {data && (
            <div className="space-y-2 text-left">
              <div className="mb-3 rounded bg-green-50 px-3 py-2 text-center font-semibold text-green-700">
                {"\u2714 "}
                {data.status}
              </div>
              <Row label="Receipt Number" value={data.receiptNumber} />
              <Row label="Taxpayer Name" value={data.taxpayerName} />
              <Row
                label="Payment Date"
                value={
                  data.paymentDate
                    ? new Date(data.paymentDate).toLocaleString("en-IN")
                    : "-"
                }
              />
              <Row label="Amount" value={inr(data.amount)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
