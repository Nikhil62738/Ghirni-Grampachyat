import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";

// Shared loader for the taxpayer dashboard payload used across screens.
// The endpoint returns { profile, taxSummary, taxHistory, payments, receipts }.
export default function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      setData(res.data.data);
      setError("");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { data, loading, refreshing, refresh, error };
}
