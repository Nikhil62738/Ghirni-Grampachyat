import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import { PageTitle, Spinner, Alert } from "../../components/ui.jsx";

const COLORS = [
  "#1e3a8a",
  "#138808",
  "#FF9933",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
];

export default function Analytics() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/analytics/charts");
        setData(res.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle title={t("analytics")} />
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Monthly Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.monthlyCollection || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1e3a8a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Ward-wise Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.wardWise || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ward" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="collected" fill="#138808" />
              <Bar dataKey="due" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Tax Category Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data?.categoryWise || []}
                dataKey="collected"
                nameKey="category"
                outerRadius={90}
                label
              >
                {(data?.categoryWise || []).map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Payment Mode Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.modeWise || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mode" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#FF9933" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
