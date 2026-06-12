import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useI18n } from "../../context/I18nContext.jsx";
import GovHeader from "../../components/GovHeader.jsx";
import { Alert, Spinner, inr } from "../../components/ui.jsx";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function TaxpayerDashboard() {
  const { logout } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [payAmount, setPayAmount] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      setData(res.data.data);
      setPayAmount(String(res.data.data.taxSummary.totalDue || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  const payNow = async () => {
    setError("");
    setMsg("");
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return setError("Enter a valid amount");
    const ok = await loadRazorpayScript();
    if (!ok) return setError("Could not load payment gateway");
    try {
      const res = await api.post("/payments/online/order", { amount });
      const order = res.data.data;
      const profile = data?.profile || {};
      const prefill = {
        name: profile.fullName,
        email: profile.email,
        contact: profile.mobileNumber,
      };
      const theme = { color: "#1e3a8a" };
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Gram Panchayat Ghirni",
        description: "Property Tax Payment",
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post("/payments/online/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setMsg("Payment successful! Receipt generated and emailed.");
            load();
          } catch (err) {
            setError(err.message);
          }
        },
        prefill,
        theme,
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadReceipt = async (receiptId, receiptNumber) => {
    if (!receiptId) return;
    try {
      const res = await api.get("/receipts/" + receiptId + "/download", {
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

  if (loading) return <Spinner />;

  const profile = data?.profile || {};
  const summary = data?.taxSummary || {};
  const announcements = data?.announcements || [];
  const history = data?.taxHistory || [];
  const payments = data?.payments || [];
  const receipts = data?.receipts || [];

  // map receipts by their payment reference for download links
  const receiptByPayment = {};
  receipts.forEach((r) => {
    if (r.payment) receiptByPayment[String(r.payment)] = r;
  });

  const logoutBtn = (
    <button
      type="button"
      onClick={doLogout}
      className="rounded bg-white/15 px-3 py-1 text-xs hover:bg-white/25"
    >
      {t("logout")}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <GovHeader right={logoutBtn} />
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{msg}</Alert>

        {announcements.length > 0 && (
          <section className="card">
            <h2 className="mb-3 text-lg font-bold">{t("noticesTitle")}</h2>
            <div className="space-y-2">
              {announcements.map((a) => {
                const title = lang === "mr" && a.titleMr ? a.titleMr : a.title;
                const body = lang === "mr" && a.bodyMr ? a.bodyMr : a.body;
                return (
                  <div key={a._id} className="gov-notice">
                    <div className="font-semibold">
                      {a.pinned ? "\u2605 " : ""}
                      {title}
                    </div>
                    {body ? (
                      <div className="mt-1 whitespace-pre-line">{body}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="card">
          <h2 className="mb-3 text-lg font-bold">{t("profile")}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Field label="Taxpayer ID" value={profile.taxpayerId} />
            <Field label="Name" value={profile.fullName} />
            <Field label="Father's Name" value={profile.fatherName} />
            <Field label="House Number" value={profile.houseNumber} />
            <Field label="Property Number" value={profile.propertyNumber} />
            <Field label="Ward Number" value={profile.wardNumber} />
            <Field label="Village" value={profile.village} />
            <Field label="Mobile" value={profile.mobileNumber} />
            <Field label="Email" value={profile.email} />
            <Field label="Address" value={profile.address} />
          </div>
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg font-bold">{t("taxSummary")}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field
              label="Previous Balance"
              value={inr(summary.previousBalance)}
            />
            <Field label="Current Tax" value={inr(summary.currentTax)} />
            <Field label="Penalty" value={inr(summary.penalty)} />
            <Field label="Total Due" value={inr(summary.totalDue)} />
            <Field label="Paid Amount" value={inr(summary.paidAmount)} />
            <Field label="Remaining" value={inr(summary.remainingAmount)} />
            <Field
              label="Due Date"
              value={
                summary.dueDate
                  ? new Date(summary.dueDate).toLocaleDateString("en-IN")
                  : "-"
              }
            />
            <Field label="Status" value={summary.status} />
          </div>

          {summary.totalDue > 0 && (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <label className="label">Amount to Pay</label>
                <input
                  className="input"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={payNow}>
                {t("payNow")} (Razorpay)
              </button>
            </div>
          )}
        </section>

        <section className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-bold">{t("taxHistory")}</h2>
          <table className="table-base">
            <thead>
              <tr>
                <th>Year</th>
                <th>Tax</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{h.financialYear}</td>
                  <td>{inr(h.tax)}</td>
                  <td>{inr(h.paid)}</td>
                  <td>{inr(h.due)}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    No history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto">
          <h2 className="mb-3 text-lg font-bold">{t("paymentHistory")}</h2>
          <table className="table-base">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const receipt = receiptByPayment[String(p._id)];
                return (
                  <tr key={p._id}>
                    <td>{receipt?.receiptNumber || "-"}</td>
                    <td>
                      {new Date(
                        p.paymentDate || p.createdAt,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td>{inr(p.amount)}</td>
                    <td>{p.mode}</td>
                    <td>
                      {receipt ? (
                        <button
                          className="text-gov underline"
                          onClick={() =>
                            downloadReceipt(receipt._id, receipt.receiptNumber)
                          }
                        >
                          {t("download")}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    No payments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-800 dark:text-slate-100">
        {value || "-"}
      </div>
    </div>
  );
}
