import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

const PERMISSIONS = [
  ["manage_taxpayers", "Manage Taxpayers"],
  ["manage_payments", "Manage Payments"],
  ["manage_reports", "Manage Reports"],
  ["manage_notifications", "Manage Notifications"],
  ["manage_receipts", "Manage Receipts"],
  ["manage_analytics", "Manage Analytics"],
  ["manage_settings", "Manage Settings"],
  ["manage_admins", "Manage Admins"],
];

export default function AdminManagement() {
  const { t } = useI18n();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [],
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admins");
      setAdmins(res.data.data.admins || res.data.data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePerm = (perm) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const create = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.post("/admins", form);
      setMsg("Admin created");
      setForm({ name: "", email: "", password: "", permissions: [] });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAdminPerm = async (admin, perm) => {
    const next = (admin.permissions || []).includes(perm)
      ? admin.permissions.filter((p) => p !== perm)
      : [...(admin.permissions || []), perm];
    try {
      await api.patch("/admins/" + admin._id, { permissions: next });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      await api.delete("/admins/" + id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageTitle title={t("adminManagement")} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>

      <form
        onSubmit={create}
        className="card mb-5 grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>
        <div className="md:col-span-3">
          <label className="label">Permissions</label>
          <div className="flex flex-wrap gap-3">
            {PERMISSIONS.map(([perm, label]) => (
              <label key={perm} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(perm)}
                  onChange={() => togglePerm(perm)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <button className="btn-primary">Create Admin</button>
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.isSuperAdmin ? "Super Admin" : "Admin"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {a.isSuperAdmin ? (
                        <span className="text-xs text-slate-400">
                          All permissions
                        </span>
                      ) : (
                        PERMISSIONS.map(([perm, label]) => (
                          <label
                            key={perm}
                            className="flex items-center gap-1 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={(a.permissions || []).includes(perm)}
                              onChange={() => toggleAdminPerm(a, perm)}
                            />
                            {label}
                          </label>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    {!a.isSuperAdmin && (
                      <button
                        className="text-red-600 underline"
                        onClick={() => remove(a._id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
