import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert, inr } from "../../components/ui.jsx";

export default function Taxpayers() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/taxpayers", {
        params: { search, limit: 50 },
      });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (
      !window.confirm(
        "Delete this taxpayer? All their payments, receipts and history will be permanently deleted.",
      )
    )
      return;
    try {
      await api.delete("/taxpayers/" + id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addBtn = (
    <Link to="/admin/taxpayers/add" className="btn-primary">
      + {t("addTaxpayer")}
    </Link>
  );

  return (
    <div>
      <PageTitle title={t("taxpayers")} action={addBtn} />
      <Alert type="error">{error}</Alert>

      <div className="mb-3 flex gap-2">
        <input
          className="input max-w-sm"
          placeholder="Search by name, mobile, email, house, property..."
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
                <th>ID</th>
                <th>Name</th>
                <th>Ward</th>
                <th>Mobile</th>
                <th>Total Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tp) => (
                <tr key={tp._id}>
                  <td>{tp.taxpayerId}</td>
                  <td>{tp.fullName}</td>
                  <td>{tp.wardNumber}</td>
                  <td>{tp.mobileNumber}</td>
                  <td>{inr(tp.totalDue)}</td>
                  <td>{tp.status}</td>
                  <td className="space-x-3 whitespace-nowrap">
                    <Link
                      className="text-gov underline"
                      to={"/admin/taxpayers/" + tp._id + "/edit"}
                    >
                      Edit
                    </Link>
                    <button
                      className="text-red-600 underline"
                      onClick={() => remove(tp._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400">
                    No taxpayers found
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
