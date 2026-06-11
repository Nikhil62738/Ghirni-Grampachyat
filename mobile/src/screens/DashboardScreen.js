import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      setData(res.data.data);
    } catch (e) {
      // keep previous data on error
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  const profile = data?.profile || {};
  const tax = data?.taxSummary || {};
  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.muted}>ID: {profile.taxpayerId}</Text>
        <Text style={styles.muted}>Ward: {profile.wardNumber}</Text>
        <Text style={styles.muted}>{profile.email}</Text>
      </View>

      <View style={styles.dueCard}>
        <Text style={styles.dueLabel}>Total Outstanding Due</Text>
        <Text style={styles.dueAmount}>{inr(tax.totalDue)}</Text>
        <Text style={styles.dueStatus}>Status: {tax.status}</Text>
      </View>

      <View style={styles.row}>
        <Stat label="Current Tax" value={inr(tax.currentTax)} />
        <Stat label="Penalty" value={inr(tax.penalty)} />
      </View>
      <View style={styles.row}>
        <Stat label="Previous Balance" value={inr(tax.previousBalance)} />
        <Stat label="Paid" value={inr(tax.paidAmount)} />
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "bold", color: COLORS.gov },
  muted: { color: COLORS.muted, marginTop: 2 },
  dueCard: {
    backgroundColor: COLORS.gov,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  dueLabel: { color: "#cbd5e1", fontSize: 13 },
  dueAmount: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 4,
  },
  dueStatus: { color: "#fff" },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  logout: {
    marginTop: 8,
    marginBottom: 40,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gov,
    alignItems: "center",
  },
  logoutText: { color: COLORS.gov, fontWeight: "bold" },
});
