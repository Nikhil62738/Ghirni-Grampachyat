import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { API_BASE_URL, COLORS } from "../config";
import { Card, EmptyText, inr, fmtDate } from "../components/ui";

export default function PaymentHistoryScreen() {
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();
  const [downloadingId, setDownloadingId] = useState(null);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  const payments = data?.payments || [];
  const receipts = data?.receipts || [];
  const receiptByPayment = {};
  receipts.forEach((r) => {
    if (r.payment) receiptByPayment[String(r.payment)] = r;
  });

  const downloadReceipt = async (receipt) => {
    if (!receipt || !receipt._id) return;
    setDownloadingId(receipt._id);
    try {
      const token = await AsyncStorage.getItem("gp_token");
      const safeName =
        String(receipt.receiptNumber || "receipt").replace(
          /[^a-zA-Z0-9]/g,
          "_",
        ) + ".pdf";
      const target = FileSystem.cacheDirectory + safeName;
      const result = await FileSystem.downloadAsync(
        API_BASE_URL + "/receipts/" + receipt._id + "/download",
        target,
        { headers: { Authorization: "Bearer " + token } },
      );
      if (result.status && result.status >= 400) {
        throw new Error("HTTP " + result.status);
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          dialogTitle: receipt.receiptNumber || "",
        });
      } else {
        Alert.alert(t("downloaded"), result.uri);
      }
    } catch (e) {
      Alert.alert(t("downloadFailed"), String(e.message || e));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
    >
      <Card title={t("paymentHistory")}>
        {payments.length === 0 ? (
          <EmptyText>{t("noPayments")}</EmptyText>
        ) : (
          payments.map((p) => {
            const receipt = receiptByPayment[String(p._id)];
            return (
              <View key={p._id} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.receiptNo}>
                    {receipt?.receiptNumber || "-"}
                  </Text>
                  <Text style={styles.amount}>{inr(p.amount)}</Text>
                </View>
                <Text style={styles.muted}>
                  {t("date")}: {fmtDate(p.paymentDate || p.createdAt)}
                </Text>
                <Text style={styles.muted}>
                  {t("mode")}: {p.mode || "-"}
                </Text>
                {receipt ? (
                  <TouchableOpacity
                    style={styles.dlBtn}
                    onPress={() => downloadReceipt(receipt)}
                    disabled={downloadingId === receipt._id}
                  >
                    {downloadingId === receipt._id ? (
                      <ActivityIndicator color={COLORS.gov} />
                    ) : (
                      <Text style={styles.dlText}>{t("download")}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between" },
  receiptNo: { fontWeight: "bold", color: COLORS.text },
  amount: { fontWeight: "bold", color: COLORS.india },
  muted: { color: COLORS.muted, marginTop: 2, fontSize: 13 },
  dlBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gov,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  dlText: { color: COLORS.gov, fontWeight: "600" },
});
