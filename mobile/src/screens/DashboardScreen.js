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
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

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
  const history = data?.taxHistory || [];
  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <View style={styles.dueCard}>
        <Text style={styles.dueLabel}>Total Outstanding Due</Text>
        <Text style={styles.dueAmount}>{inr(tax.totalDue)}</Text>
        <Text style={styles.dueStatus}>Status: {tax.status || "-"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tax Summary</Text>
        <Field label="Previous Balance" value={inr(tax.previousBalance)} />
        <Field label="Current Tax" value={inr(tax.currentTax)} />
        <Field label="Penalty" value={inr(tax.penalty)} />
        <Field label="Total Due" value={inr(tax.totalDue)} />
        <Field label="Paid Amount" value={inr(tax.paidAmount)} />
        <Field label="Remaining" value={inr(tax.remainingAmount)} />
        <Field label="Due Date" value={fmtDate(tax.dueDate)} />
        <Field label="Status" value={tax.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tax History</Text>
        <View style={styles.thead}>
          <Text style={[styles.th, styles.colYear]}>Year</Text>
          <Text style={[styles.th, styles.colNum]}>Tax</Text>
          <Text style={[styles.th, styles.colNum]}>Paid</Text>
          <Text style={[styles.th, styles.colNum]}>Due</Text>
        </View>
        {history.length === 0 ? (
          <Text style={styles.empty}>No history</Text>
        ) : (
          history.map((h, i) => (
            <View key={i} style={styles.trow}>
              <Text style={[styles.td, styles.colYear]}>{h.financialYear}</Text>
              <Text style={[styles.td, styles.colNum]}>{inr(h.tax)}</Text>
              <Text style={[styles.td, styles.colNum]}>{inr(h.paid)}</Text>
              <Text style={[styles.td, styles.colNum]}>{inr(h.due)}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gov,
    marginBottom: 10,
  },
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
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fieldLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  fieldValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  thead: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  trow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  th: { fontSize: 12, fontWeight: "bold", color: COLORS.muted },
  td: { fontSize: 12, color: COLORS.text },
  colYear: { flex: 1.4 },
  colNum: { flex: 1, textAlign: "right" },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 12 },
  logout: {
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gov,
    alignItems: "center",
  },
  logoutText: { color: COLORS.gov, fontWeight: "bold" },
});
