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
import { COLORS } from "../config";
import {
  Card,
  Field,
  PrimaryButton,
  OutlineButton,
  inr,
} from "../components/ui";

export default function HomeScreen({ navigation }) {
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  const profile = data?.profile || {};
  const tax = data?.taxSummary || {};

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
    >
      <View style={styles.dueCard}>
        <Text style={styles.welcome}>
          {t("welcome")}, {profile.fullName || ""}
        </Text>
        <Text style={styles.dueLabel}>{t("totalOutstandingDue")}</Text>
        <Text style={styles.dueAmount}>{inr(tax.totalDue)}</Text>
        <Text style={styles.dueStatus}>
          {t("status")}: {tax.status || "-"}
        </Text>
      </View>

      <PrimaryButton
        label={t("payNow")}
        onPress={() => navigation.navigate("PayTax")}
      />
      <OutlineButton
        label={t("viewReceipts")}
        onPress={() => navigation.navigate("PaymentHistory")}
      />

      <Card title={t("profile")} style={styles.topGap}>
        <Field label={t("taxpayerId")} value={profile.taxpayerId} />
        <Field label={t("name")} value={profile.fullName} />
        <Field label={t("fatherName")} value={profile.fatherName} />
        <Field label={t("wardNumber")} value={profile.wardNumber} />
        <Field label={t("village")} value={profile.village} />
        <Field label={t("mobile")} value={profile.mobileNumber} />
        <Field label={t("email")} value={profile.email} />
      </Card>

      <Card title={t("taxSummary")}>
        <Field label={t("currentTax")} value={inr(tax.currentTax)} />
        <Field label={t("penalty")} value={inr(tax.penalty)} />
        <Field label={t("totalDue")} value={inr(tax.totalDue)} />
        <Field label={t("paidAmount")} value={inr(tax.paidAmount)} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  dueCard: {
    backgroundColor: COLORS.gov,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  welcome: { color: "#cbd5e1", fontSize: 14, marginBottom: 8 },
  dueLabel: { color: "#cbd5e1", fontSize: 13 },
  dueAmount: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 4,
  },
  dueStatus: { color: "#fff" },
  topGap: { marginTop: 8 },
});
