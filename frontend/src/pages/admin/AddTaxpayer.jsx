import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Alert, Spinner } from "../../components/ui.jsx";

const FIELDS = [
  ["fullName", "Full Name", true],
  ["fatherName", "Father's Name", false],
  ["houseNumber", "House Number", false],
  ["propertyNumber", "Property Number", false],
  ["wardNumber", "Ward Number", false],
  ["village", "Village", false],
  ["mobileNumber", "Mobile Number", false],
  ["email", "Email", false],
  ["aadhaarLast4", "Aadhaar Last 4", false],
  ["address", "Address", false],
  ["currentTax", "Current Tax", false],
  ["previousBalance", "Previous Balance", false],
];

const initialForm = {
  fullName: "",
  fatherName: "",
  houseNumber: "",
  propertyNumber: "",
  wardNumber: "",
  village: "Ghirni",
  mobileNumber: "",
  email: "",
  aadhaarLast4: "",
  address: "",
  currentTax: "",
  previousBalance: "",
  propertyType: "residential",
  taxCategory: "general",
  status: "pending",
};

export default function AddTaxpayer() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const res = await api.get("/taxpayers/" + id);
        const tp = res.data.data.taxpayer;
        if (!active) return;
        setForm({
          fullName: tp.fullName || "",
          fatherName: tp.fatherName || "",
          houseNumber: tp.houseNumber || "",
          propertyNumber: tp.propertyNumber || "",
          wardNumber: tp.wardNumber || "",
          village: tp.village || "",
          mobileNumber: tp.mobileNumber || "",
          email: tp.email || "",
          aadhaarLast4: tp.aadhaarLast4 || "",
          address: tp.address || "",
          currentTax: tp.currentTax != null ? String(tp.currentTax) : "",
          previousBalance:
            tp.previousBalance != null ? String(tp.previousBalance) : "",
          propertyType: tp.propertyType || "residential",
          taxCategory: tp.taxCategory || "general",
          status: tp.status || "pending",
        });
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const payload = {
        ...form,
        currentTax: Number(form.currentTax || 0),
        previousBalance: Number(form.previousBalance || 0),
      };
      if (isEdit) {
        const res = await api.patch("/taxpayers/" + id, payload);
        setMsg("Taxpayer updated: " + res.data.data.taxpayer.taxpayerId);
      } else {
        const res = await api.post("/taxpayers", payload);
        setMsg("Taxpayer created: " + res.data.data.taxpayer.taxpayerId);
        setForm(initialForm);
      }
      setTimeout(() => navigate("/admin/taxpayers"), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle title={isEdit ? "Edit Taxpayer" : t("addTaxpayer")} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>
      <form
        onSubmit={submit}
        className="card grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {FIELDS.map(([key, label, required]) => (
          <div key={key}>
            <label className="label">
              {label} {required ? "*" : ""}
            </label>
            <input
              className="input"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              required={required}
            />
          </div>
        ))}
        <div>
          <label className="label">Property Type</label>
          <select
            className="input"
            value={form.propertyType}
            onChange={(e) => set("propertyType", e.target.value)}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="agricultural">Agricultural</option>
            <option value="industrial">Industrial</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Tax Category</label>
          <input
            className="input"
            value={form.taxCategory}
            onChange={(e) => set("taxCategory", e.target.value)}
          />
        </div>
        {isEdit ? (
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : isEdit ? "Update Taxpayer" : "Save Taxpayer"}
          </button>
        </div>
      </form>
    </div>
  );
}
