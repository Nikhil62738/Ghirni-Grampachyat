import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config";
import {
  AppHeader,
  Card,
  Badge,
  EmptyState,
  inr,
  fmtDate,
} from "../components/ui";

export default function HistoryScreen({ route }) {
  const initialTab = route?.params?.tab === "payments" ? "payments" : "tax";
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);
  const [tab, setTab] = useState(initialTab);

  return (
    <View style={s.screen}>
      <AppHeader
        title={t("history")}
        subtitle={t("appName")}
        onBell={() => Alert.alert(t("notifications"), t("noNotifications"))}
      />
      <View style={s.segment}>
        <TouchableOpacity
          style={[s.segBtn, tab === "tax" ? s.segActive : null]}
          onPress={() => setTab("tax")}
        >
          <Text style={[s.segText, tab === "tax" ? s.segTextActive : null]}>
            {t("taxHistory")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.segBtn, tab === "payments" ? s.segActive : null]}
          onPress={() => setTab("payments")}
        >
          <Text
            style={[s.segText, tab === "payments" ? s.segTextActive : null]}
          >
            {t("paymentHistory")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} />
        }
      >
        {loading && !data ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : tab === "tax" ? (
          <TaxHistoryView s={s} colors={colors} t={t} data={data} />
        ) : (
          <PaymentHistoryView s={s} colors={colors} t={t} data={data} />
        )}
      </ScrollView>
    </View>
  );
}

function TaxHistoryView({ s, colors, t, data }) {
  const history = data?.taxHistory || [];
  const [query, setQuery] = useState("");
  const filtered = history.filter((h) =>
    String(h.financialYear || "").includes(query.trim()),
  );

  const downloadStatement = () =>
    Alert.alert(t("downloadStatement"), t("comingSoon"));

  return (
    <View>
      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchYear")}
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
        />
      </View>

      <Card title={t("taxHistory")}>
        <View style={s.thead}>
          <Text style={[s.th, s.colYear]}>{t("year")}</Text>
          <Text style={[s.th, s.colNum]}>{t("tax")}</Text>
          <Text style={[s.th, s.colNum]}>{t("paid")}</Text>
          <Text style={[s.th, s.colNum]}>{t("remaining")}</Text>
        </View>
        {filtered.length === 0 ? (
          <EmptyState icon="time-outline" text={t("noHistory")} />
        ) : (
          filtered.map((h, i) => (
            <View key={i} style={s.trow}>
              <Text style={[s.td, s.colYear]}>{h.financialYear}</Text>
              <Text style={[s.td, s.colNum]}>{inr(h.tax)}</Text>
              <Text style={[s.tdPaid, s.colNum]}>{inr(h.paid)}</Text>
              <Text style={[s.tdDue, s.colNum]}>{inr(h.due)}</Text>
            </View>
          ))
        )}
      </Card>

      <TouchableOpacity style={s.stmtBtn} onPress={downloadStatement}>
        <Ionicons name="download-outline" size={18} color={colors.primary} />
        <Text style={s.stmtText}>{t("downloadStatement")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PaymentHistoryView({ s, colors, t, data }) {
  const payments = data?.payments || [];
  const receipts = data?.receipts || [];
  const [downloadingId, setDownloadingId] = useState(null);

  const receiptByPayment = {};
  receipts.forEach((r) => {
    if (r.payment) receiptByPayment[String(r.payment)] = r;
  });

  const downloadReceipt = async (receipt, share) => {
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

  if (payments.length === 0) {
    return (
      <Card>
        <EmptyState icon="wallet-outline" text={t("noPayments")} />
      </Card>
    );
  }

  return (
    <View>
      {payments.map((p) => {
        const receipt = receiptByPayment[String(p._id)];
        const isBusy = receipt && downloadingId === receipt._id;
        return (
          <Card key={p._id}>
            <View style={s.payTop}>
              <Text style={s.receiptNo}>{receipt?.receiptNumber || "-"}</Text>
              <Badge label={t("completed")} tone="paid" />
            </View>
            <View style={s.payDetail}>
              <Text style={s.payMuted}>
                {t("date")}: {fmtDate(p.paymentDate || p.createdAt)}
              </Text>
              <Text style={s.payAmount}>{inr(p.amount)}</Text>
            </View>
            <Text style={s.payMuted}>
              {t("mode")}: {p.mode || "-"}
            </Text>
            {receipt ? (
              <View style={s.btnRow}>
                <TouchableOpacity
                  style={s.dlBtn}
                  onPress={() => downloadReceipt(receipt, false)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={s.dlText}>{t("downloadPdf")}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.shareBtn}
                  onPress={() => downloadReceipt(receipt, true)}
                  disabled={isBusy}
                >
                  <Ionicons name="share-social" size={16} color="#fff" />
                  <Text style={s.shareText}>{t("shareReceipt")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    center: { paddingVertical: 40, alignItems: "center" },
    segment: {
      flexDirection: "row",
      backgroundColor: c.cardAlt,
      margin: 16,
      marginBottom: 0,
      borderRadius: 12,
      padding: 4,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: "center",
    },
    segActive: { backgroundColor: c.primary },
    segText: { color: c.muted, fontWeight: "600", fontSize: 13 },
    segTextActive: { color: "#fff" },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 14,
    },
    searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, color: c.text },
    thead: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: c.border,
      paddingBottom: 8,
    },
    trow: {
      flexDirection: "row",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    th: { fontSize: 12, fontWeight: "700", color: c.muted },
    td: { fontSize: 13, color: c.text },
    tdPaid: { fontSize: 13, color: c.success, fontWeight: "600" },
    tdDue: { fontSize: 13, color: c.danger, fontWeight: "600" },
    colYear: { flex: 1.4 },
    colNum: { flex: 1, textAlign: "right" },
    stmtBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 12,
      paddingVertical: 13,
      marginTop: 4,
    },
    stmtText: { color: c.primary, fontWeight: "700", marginLeft: 8 },
    payTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    receiptNo: { fontWeight: "700", color: c.text, fontSize: 15 },
    payDetail: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    payMuted: { color: c.muted, fontSize: 13, marginTop: 3 },
    payAmount: { color: c.success, fontWeight: "800", fontSize: 18 },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    dlBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
    },
    dlText: { color: c.primary, fontWeight: "700" },
    shareBtn: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    shareText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  });
}
