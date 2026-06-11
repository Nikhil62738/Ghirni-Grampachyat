import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { COLORS } from "../config";
import { Card, Field, PrimaryButton, inr, fmtDate } from "../components/ui";

export default function TaxSummaryScreen({ navigation }) {
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  const tax = data?.taxSummary || {};

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
    >
      <Card title={t("taxSummary")}>
        <Field label={t("previousBalance")} value={inr(tax.previousBalance)} />
        <Field label={t("currentTax")} value={inr(tax.currentTax)} />
        <Field label={t("penalty")} value={inr(tax.penalty)} />
        <Field label={t("totalDue")} value={inr(tax.totalDue)} />
        <Field label={t("paidAmount")} value={inr(tax.paidAmount)} />
        <Field label={t("remaining")} value={inr(tax.remainingAmount)} />
        <Field label={t("dueDate")} value={fmtDate(tax.dueDate)} />
        <Field label={t("status")} value={tax.status} />
      </Card>

      {tax.totalDue > 0 ? (
        <PrimaryButton
          label={t("payNow")}
          onPress={() => navigation.navigate("PayTax")}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
