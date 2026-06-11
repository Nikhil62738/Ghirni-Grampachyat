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
import { Card, EmptyText, inr } from "../components/ui";

export default function TaxHistoryScreen() {
  const { data, loading, reload } = useDashboard();
  const { t } = useI18n();

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  const history = data?.taxHistory || [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
    >
      <Card title={t("taxHistory")}>
        <View style={styles.thead}>
          <Text style={[styles.th, styles.colYear]}>{t("year")}</Text>
          <Text style={[styles.th, styles.colNum]}>{t("tax")}</Text>
          <Text style={[styles.th, styles.colNum]}>{t("paid")}</Text>
          <Text style={[styles.th, styles.colNum]}>{t("due")}</Text>
        </View>
        {history.length === 0 ? (
          <EmptyText>{t("noHistory")}</EmptyText>
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
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
});
