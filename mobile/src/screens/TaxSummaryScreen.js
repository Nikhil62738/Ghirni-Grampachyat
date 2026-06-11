import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import {
  Card,
  Field,
  Badge,
  ProgressBar,
  PrimaryButton,
  inr,
  fmtDate,
} from "../components/ui";

function statusTone(tax) {
  const due = Number(tax.totalDue || 0);
  if (due <= 0) return "paid";
  if (tax.dueDate && new Date(tax.dueDate).getTime() < Date.now())
    return "overdue";
  return "pending";
}

export default function TaxSummaryScreen({ navigation }) {
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);

  if (loading && !data) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const tax = data?.taxSummary || {};
  const tone = statusTone(tax);
  const toneLabel =
    tone === "paid"
      ? t("statusPaid")
      : tone === "overdue"
        ? t("statusOverdue")
        : t("statusPending");

  const paid = Number(tax.paidAmount || 0);
  const total = paid + Number(tax.remainingAmount || tax.totalDue || 0);
  const pct = total > 0 ? (paid / total) * 100 : tone === "paid" ? 100 : 0;
  const rem = 100 - pct;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
    >
      <Card
        title={t("taxSummary")}
        right={<Badge label={toneLabel} tone={tone} />}
      >
        <Field label={t("previousBalance")} value={inr(tax.previousBalance)} />
        <Field label={t("currentTax")} value={inr(tax.currentTax)} />
        <Field label={t("penalty")} value={inr(tax.penalty)} />
        <Field
          label={t("paidAmount")}
          value={inr(tax.paidAmount)}
          valueColor={colors.success}
        />
        <Field
          label={t("remainingAmount")}
          value={inr(tax.remainingAmount)}
          valueColor={colors.danger}
        />
        <Field label={t("dueDate")} value={fmtDate(tax.dueDate)} />
        <Field
          label={t("totalDue")}
          value={inr(tax.totalDue)}
          last
        />
      </Card>

      <Card title={t("paymentProgress")}>
        <ProgressBar percent={pct} />
        <View style={s.pctRow}>
          <Text style={s.pctPaid}>
            {Math.round(pct)}{t("percentPaid")}
          </Text>
          <Text style={s.pctRem}>
            {Math.round(rem)}{t("percentRemaining")}
          </Text>
        </View>
      </Card>

      {Number(tax.totalDue) > 0 ? (
        <PrimaryButton
          label={t("payNowRazorpay")}
          icon="card-outline"
          color={colors.success}
          onPress={() => navigation.navigate("PayTax")}
        />
      ) : null}
    </ScrollView>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
    pctRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    pctPaid: { color: c.success, fontWeight: "700", fontSize: 13 },
    pctRem: { color: c.danger, fontWeight: "700", fontSize: 13 },
  });
}
