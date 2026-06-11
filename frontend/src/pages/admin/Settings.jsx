import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Settings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState(null);
  const [taxRates, setTaxRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [applying, setApplying] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/settings");
      const s = res.data.data.settings;
      setSettings(s);
      setTaxRates(s.taxRates || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.patch("/settings", {
        gramPanchayatName: settings.gramPanchayatName,
        village: settings.village,
        taluka: settings.taluka,
        district: settings.district,
        state: settings.state,
        pincode: settings.pincode,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        penaltyPercentPerYear: Number(settings.penaltyPercentPerYear),
        fixedTaxAmount: Number(settings.fixedTaxAmount || 0),
        taxApplyMonth: Number(settings.taxApplyMonth || 4),
        taxApplyDay: Number(settings.taxApplyDay || 1),
        taxRates,
      });
      setMsg("Settings saved");
    } catch (err) {
      setError(err.message);
    }
  };

  const runTax = async () => {
    if (
      !window.confirm(
        "This will apply the configured yearly tax to ALL taxpayers right now. Continue?",
      )
    )
      return;
    setError("");
    setMsg("");
    setApplying(true);
    try {
      const res = await api.post("/settings/run-tax");
      setMsg(res.data.message || "Tax applied to all taxpayers");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const backup = async () => {
    try {
      const res = await api.get("/settings/backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "gp-ghirni-backup.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner />;

  const backupBtn = (
    <button type="button" className="btn-outline" onClick={backup}>
      Backup (Download JSON)
    </button>
  );

  return (
    <div>
      <PageTitle title={t("settings")} action={backupBtn} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>

      <form
        onSubmit={save}
        className="card grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <Input
          label="Gram Panchayat Name"
          value={settings.gramPanchayatName}
          onChange={(v) => set("gramPanchayatName", v)}
        />
        <Input
          label="Village"
          value={settings.village}
          onChange={(v) => set("village", v)}
        />
        <Input
          label="Taluka"
          value={settings.taluka}
          onChange={(v) => set("taluka", v)}
        />
        <Input
          label="District"
          value={settings.district}
          onChange={(v) => set("district", v)}
        />
        <Input
          label="State"
          value={settings.state}
          onChange={(v) => set("state", v)}
        />
        <Input
          label="Pincode"
          value={settings.pincode}
          onChange={(v) => set("pincode", v)}
        />
        <Input
          label="Contact Email"
          value={settings.contactEmail}
          onChange={(v) => set("contactEmail", v)}
        />
        <Input
          label="Contact Phone"
          value={settings.contactPhone}
          onChange={(v) => set("contactPhone", v)}
        />
        <Input
          label="Penalty % per year"
          value={settings.penaltyPercentPerYear}
          onChange={(v) => set("penaltyPercentPerYear", v)}
        />

        <div className="md:col-span-2 rounded-lg border border-gov/30 bg-gov/5 p-4 dark:bg-slate-700/40">
          <h3 className="mb-1 font-semibold text-gov dark:text-gov-light">
            Annual Tax (applied to every taxpayer)
          </h3>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Set a fixed tax amount and the date it is automatically added to
            every taxpayer each year. Leave the amount as 0 to use the
            per-category tax rates below instead.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="Fixed Tax Amount (Rs.)"
              value={settings.fixedTaxAmount}
              onChange={(v) => set("fixedTaxAmount", v)}
            />
            <Input
              label="Apply Day (1-31)"
              value={settings.taxApplyDay}
              onChange={(v) => set("taxApplyDay", v)}
            />
            <div>
              <label className="label">Apply Month</label>
              <select
                className="input"
                value={settings.taxApplyMonth ?? 4}
                onChange={(e) => set("taxApplyMonth", Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runTax}
              disabled={applying}
              className="btn-outline"
            >
              {applying ? "Applying..." : "Apply Tax to All Taxpayers Now"}
            </button>
            {settings.lastTaxRunYear ? (
              <span className="text-xs text-slate-500">
                Last applied year: {settings.lastTaxRunYear}
              </span>
            ) : null}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="label">Tax Rates (by category)</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Object.entries(taxRates).map(([cat, rate]) => (
              <div key={cat}>
                <span className="text-xs capitalize text-slate-500">{cat}</span>
                <input
                  className="input"
                  value={rate}
                  onChange={(e) =>
                    setTaxRates({ ...taxRates, [cat]: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <button className="btn-primary">Save Settings</button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
