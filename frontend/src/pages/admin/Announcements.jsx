import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

const EMPTY = {
  title: "",
  titleMr: "",
  body: "",
  bodyMr: "",
  pinned: false,
  active: true,
};

export default function Announcements() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/announcements/all");
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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setForm(EMPTY);
    setEditId(null);
  };

  const submit = async () => {
    setError("");
    setMsg("");
    if (!form.title.trim()) return setError(t("annTitleRequired"));
    setBusy(true);
    try {
      if (editId) {
        await api.patch("/announcements/" + editId, form);
        setMsg(t("annUpdated"));
      } else {
        await api.post("/announcements", form);
        setMsg(t("annCreated"));
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const edit = (a) => {
    setEditId(a._id);
    setForm({
      title: a.title || "",
      titleMr: a.titleMr || "",
      body: a.body || "",
      bodyMr: a.bodyMr || "",
      pinned: !!a.pinned,
      active: a.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (a) => {
    try {
      await api.patch("/announcements/" + a._id, { active: !a.active });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(t("annDeleteConfirm"))) return;
    try {
      await api.delete("/announcements/" + a._id);
      if (editId === a._id) reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageTitle title={t("announcements")} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{msg}</Alert>

      <div className="card mb-5">
        <h2 className="mb-3 text-base font-bold">
          {editId ? t("annEdit") : t("annNew")}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">{t("annTitleEn")}</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("annTitleMr")}</label>
            <input
              className="input"
              value={form.titleMr}
              onChange={(e) => set("titleMr", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("annBodyEn")}</label>
            <textarea
              className="input"
              rows={3}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("annBodyMr")}</label>
            <textarea
              className="input"
              rows={3}
              value={form.bodyMr}
              onChange={(e) => set("bodyMr", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => set("pinned", e.target.checked)}
            />
            {t("annPinned")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            {t("annActive")}
          </label>
          <div className="ml-auto flex gap-2">
            {editId && (
              <button className="btn-outline" onClick={reset} disabled={busy}>
                {t("cancel")}
              </button>
            )}
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy ? "..." : editId ? t("annUpdate") : t("annPublish")}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("annTitleEn")}</th>
                <th>{t("annPinned")}</th>
                <th>{t("status")}</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td>{a.title}</td>
                  <td>{a.pinned ? "\u2605" : "-"}</td>
                  <td>{a.active ? t("annActive") : t("annInactive")}</td>
                  <td>{new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="whitespace-nowrap">
                    <button
                      className="text-gov underline"
                      onClick={() => edit(a)}
                    >
                      {t("edit")}
                    </button>
                    <button
                      className="ml-3 text-gov underline"
                      onClick={() => toggleActive(a)}
                    >
                      {a.active ? t("annHide") : t("annShow")}
                    </button>
                    <button
                      className="ml-3 text-red-600 underline"
                      onClick={() => remove(a)}
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400">
                    {t("annNone")}
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
