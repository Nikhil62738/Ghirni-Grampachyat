import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { COLORS } from "../config";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      setReceipts(res.data.data.receipts || []);
    } catch (e) {
      // ignore
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

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.receiptNo}>{item.receiptNumber}</Text>
        <Text style={styles.amount}>{inr(item.amount)}</Text>
      </View>
      <Text style={styles.muted}>Date: {fmtDate(item.createdAt)}</Text>
      {item.financialYear ? (
        <Text style={styles.muted}>Financial Year: {item.financialYear}</Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={receipts}
      keyExtractor={(item, index) => item._id || String(index)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
      ListHeaderComponent={<Text style={styles.header}>Your Receipts</Text>}
      ListEmptyComponent={
        <Text style={styles.empty}>
          No receipts yet. After a successful payment, your digital receipt is
          emailed to you and appears here.
        </Text>
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gov,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.india,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptNo: { fontWeight: "bold", color: COLORS.text },
  amount: { fontWeight: "bold", color: COLORS.india },
  muted: { color: COLORS.muted, marginTop: 4, fontSize: 13 },
  empty: { color: COLORS.muted, textAlign: "center", marginTop: 40 },
});
