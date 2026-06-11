import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import api from "../api/client";

const DashboardContext = createContext({
  data: null,
  loading: true,
  error: "",
  reload: () => {},
});

export function DashboardProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/taxpayers/me/dashboard");
      setData(res.data.data);
    } catch (e) {
      setError(e.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = { data, loading, error, reload };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
