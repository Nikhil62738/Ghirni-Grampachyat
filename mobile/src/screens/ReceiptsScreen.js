import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";
import { API_BASE_URL, COLORS } from "../config";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const downloadReceipt = async (item) => {
    if (!item || !item._id) return;
    setDownloadingId(item._id);
    try {
      const token = await AsyncStorage.getItem("gp_token");
      const safeName =
        String(item.receiptNumber || "receipt").replace(/[^a-zA-Z0-9]/g, "_") +
        ".pdf";
      const target = FileSystem.cacheDirectory + safeName;
      const result = await FileSystem.downloadAsync(
        API_BASE_URL + "/receipts/" + item._id + "/download",
        target,
        { headers: { Authorization: "Bearer " + token } },
      );
      if (result.status && result.status >= 400) {
        throw new Error("Could not fetch receipt (" + result.status + ")");
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Receipt " + (item.receiptNumber || ""),
        });
      } else {
        Alert.alert("Downloaded", "Receipt saved to: " + result.uri);
      }
    } catch (e) {
      Alert.alert("Download failed", String(e.message || e));
    } finally {
      setDownloadingId(null);
    }
  };

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
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => downloadReceipt(item)}
        disabled={downloadingId === item._id}
      >
        {downloadingId === item._id ? (
          <ActivityIndicator color={COLORS.gov} />
        ) : (
          <Text style={styles.downloadText}>Download Receipt (PDF)</Text>
        )}
      </TouchableOpacity>
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
      contentContainerStyle={styles.contentList}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  contentList: { padding: 16 },
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
  downloadBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.gov,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  downloadText: { color: COLORS.gov, fontWeight: "600" },
  empty: { color: COLORS.muted, textAlign: "center", marginTop: 40 },
});
