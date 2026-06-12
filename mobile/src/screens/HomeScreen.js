import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { RADIUS } from "../config";
import {
  AppHeader,
  Card,
  Badge,
  StatCard,
  QuickAction,
  PrimaryButton,
  SectionTitle,
  Skeleton,
  inr,
  fmtDate,
} from "../components/ui";

const logo = require("../../assets/logo.png");

function statusTone(tax) {
  const due = Number(tax.totalDue || 0);
  if (due <= 0) return "paid";
  if (tax.dueDate && new Date(tax.dueDate).getTime() < Date.now())
    return "overdue";
  return "pending";
}

export default function HomeScreen({ navigation }) {
  const { data, loading, reload } = useDashboard();
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);

  const profile = data?.profile || {};
  const tax = data?.taxSummary || {};
  const tone = statusTone(tax);
  const toneLabel =
    tone === "paid"
      ? t("statusPaid")
      : tone === "overdue"
        ? t("statusOverdue")
        : t("statusPending");

  const onBell = () => navigation.navigate("Notifications");
  const contactOffice = () =>
    Alert.alert(t("qaContactOffice"), t("contactInfo"), [
      { text: "OK" },
      {
        text: "\u260E",
        onPress: () => Linking.openURL("tel:+910000000000"),
      },
    ]);

  // Admin-managed announcements (bilingual). Falls back to the default
  // static notices only when the office has not published any yet.
  const annList = (data?.announcements || []).map((a) => {
    const title = lang === "mr" && a.titleMr ? a.titleMr : a.title;
    const body = lang === "mr" && a.bodyMr ? a.bodyMr : a.body;
    return body ? title + " \u2014 " + body : title;
  });
  const notices = annList.length
    ? annList
    : [t("notice1"), t("notice2"), t("notice3")];

  return (
    <View style={s.screen}>
      <AppHeader
        title={t("appName")}
        subtitle={t("govLine")}
        onBell={onBell}
        badge={data?.unreadCount || 0}
      />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} />
        }
      >
        {/* Hero banner */}
        <View style={s.hero}>
          <Image source={logo} style={s.heroLogo} resizeMode="contain" />
          <View style={s.heroText}>
            <Text style={s.heroVillage}>{t("villageName")}</Text>
            <Text style={s.heroWelcome}>
              {t("welcome")}, {profile.fullName || ""}
            </Text>
            <Text style={s.heroMsg}>{t("welcomeMessage")}</Text>
          </View>
        </View>

        {loading && !data ? (
          <View>
            <Skeleton height={120} style={s.skelGap} />
            <Skeleton height={90} />
            <Skeleton height={90} />
          </View>
        ) : (
          <View>
            {/* Outstanding due card */}
            <View style={s.dueCard}>
              <View style={s.dueRow}>
                <Text style={s.dueLabel}>{t("totalOutstandingDue")}</Text>
                <Badge label={toneLabel} tone={tone} />
              </View>
              <Text style={s.dueAmount}>{inr(tax.totalDue)}</Text>
              <PrimaryButton
                label={t("payTax")}
                icon="card-outline"
                color={colors.saffron}
                style={s.dueBtn}
                onPress={() => navigation.navigate("PayTax")}
              />
            </View>

            {/* Statistics */}
            <SectionTitle>{t("statistics")}</SectionTitle>
            <View style={s.statGrid}>
              <StatCard label={t("currentTax")} value={inr(tax.currentTax)} />
              <StatCard
                label={t("paidAmount")}
                value={inr(tax.paidAmount)}
                tone="paid"
              />
              <StatCard
                label={t("previousBalance")}
                value={inr(tax.previousBalance)}
                tone="prev"
              />
              <StatCard
                label={t("remainingAmount")}
                value={inr(tax.remainingAmount)}
                tone="due"
              />
            </View>

            {/* Quick actions */}
            <SectionTitle>{t("quickActions")}</SectionTitle>
            <View style={s.qaGrid}>
              <QuickAction
                icon="card"
                label={t("payTax")}
                onPress={() => navigation.navigate("PayTax")}
              />
              <QuickAction
                icon="receipt"
                label={t("qaDownloadReceipt")}
                color={colors.success}
                onPress={() =>
                  navigation.navigate("History", { tab: "payments" })
                }
              />
              <QuickAction
                icon="time"
                label={t("taxHistory")}
                color={colors.saffron}
                onPress={() => navigation.navigate("History", { tab: "tax" })}
              />
              <QuickAction
                icon="wallet"
                label={t("paymentHistory")}
                color={colors.primary}
                onPress={() =>
                  navigation.navigate("History", { tab: "payments" })
                }
              />
              <QuickAction
                icon="call"
                label={t("qaContactOffice")}
                color={colors.danger}
                onPress={contactOffice}
              />
              <QuickAction
                icon="home"
                label={t("qaPropertyDetails")}
                color={colors.success}
                onPress={() => navigation.navigate("Profile")}
              />
            </View>

            {/* Tax summary shortcut */}
            <Card
              title={t("taxSummary")}
              right={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              }
            >
              <View style={s.miniRow}>
                <Text style={s.miniLabel}>{t("dueDate")}</Text>
                <Text style={s.miniValue}>{fmtDate(tax.dueDate)}</Text>
              </View>
              <PrimaryButton
                label={t("taxSummary")}
                icon="stats-chart"
                style={s.summaryBtn}
                onPress={() => navigation.navigate("TaxSummary")}
              />
            </Card>

            {/* Announcements */}
            <Card title={t("announcements")}>
              <Text style={s.noticeSub}>{t("latestNotices")}</Text>
              {notices.map((n, i) => (
                <View key={i} style={s.notice}>
                  <Ionicons
                    name="megaphone-outline"
                    size={16}
                    color={colors.saffron}
                    style={s.noticeIcon}
                  />
                  <Text style={s.noticeText}>{n}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 32 },
    skelGap: { marginBottom: 12 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.primary,
      borderRadius: RADIUS,
      padding: 16,
      marginBottom: 14,
    },
    heroLogo: {
      height: 54,
      width: 54,
      borderRadius: 14,
      backgroundColor: "#fff",
    },
    heroText: { flex: 1, marginLeft: 14 },
    heroVillage: { color: "#fff", fontSize: 16, fontWeight: "700" },
    heroWelcome: { color: "#dbeafe", fontSize: 13, marginTop: 2 },
    heroMsg: { color: "#bfdbfe", fontSize: 12, marginTop: 6, lineHeight: 17 },
    dueCard: {
      backgroundColor: c.primaryDark,
      borderRadius: RADIUS,
      padding: 18,
      marginBottom: 16,
    },
    dueRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dueLabel: { color: "#dbeafe", fontSize: 13 },
    dueAmount: {
      color: "#fff",
      fontSize: 32,
      fontWeight: "800",
      marginTop: 8,
    },
    dueBtn: { marginTop: 14 },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    qaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    miniRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    miniLabel: { color: c.muted, fontSize: 13 },
    miniValue: { color: c.text, fontSize: 13, fontWeight: "600" },
    summaryBtn: { marginTop: 12 },
    noticeSub: { color: c.muted, fontSize: 12, marginBottom: 10 },
    notice: { flexDirection: "row", paddingVertical: 7 },
    noticeIcon: { marginRight: 8, marginTop: 1 },
    noticeText: { color: c.text, fontSize: 13, flex: 1, lineHeight: 18 },
  });
}
