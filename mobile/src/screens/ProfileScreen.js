import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import {
  AppHeader,
  Card,
  Field,
  SectionTitle,
  PrimaryButton,
  OutlineButton,
  inr,
} from "../components/ui";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data } = useDashboard();
  const { t, lang, setLang } = useI18n();
  const { colors, mode, setMode } = useTheme();
  const s = useMemo(() => make(colors), [colors]);

  const profile = data?.profile || user || {};
  const initials = String(profile.fullName || "GP")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const confirmLogout = () =>
    Alert.alert(t("logout"), "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: logout },
    ]);

  const themeOptions = [
    { key: "light", label: t("lightMode"), icon: "sunny-outline" },
    { key: "dark", label: t("darkMode"), icon: "moon-outline" },
    { key: "system", label: t("systemMode"), icon: "phone-portrait-outline" },
  ];
  const langOptions = [
    { key: "en", label: t("english") },
    { key: "mr", label: t("marathi") },
  ];

  return (
    <View style={s.screen}>
      <AppHeader
        title={t("profile")}
        subtitle={t("appName")}
        onBell={() => Alert.alert(t("notifications"), t("noNotifications"))}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{profile.fullName || "-"}</Text>
          <Text style={s.idText}>{profile.taxpayerId || ""}</Text>
        </View>

        <SectionTitle>{t("taxpayerInformation")}</SectionTitle>
        <Card>
          <Field label={t("taxpayerId")} value={profile.taxpayerId} />
          <Field label={t("name")} value={profile.fullName} />
          <Field label={t("fatherName")} value={profile.fatherName} />
          <Field label={t("village")} value={profile.village} />
          <Field label={t("wardNumber")} value={profile.wardNumber} />
          <Field label={t("mobile")} value={profile.mobileNumber} />
          <Field label={t("email")} value={profile.email} last />
        </Card>

        <SectionTitle>{t("propertyDetails")}</SectionTitle>
        <Card>
          <Field
            label={t("propertyNumber")}
            value={profile.propertyNumber}
          />
          <Field label={t("propertyType")} value={profile.propertyType} />
          <Field label={t("area")} value={profile.area} />
          <Field
            label={t("assessmentValue")}
            value={
              profile.assessmentValue ? inr(profile.assessmentValue) : "-"
            }
            last
          />
        </Card>

        <SectionTitle>{t("appearance")}</SectionTitle>
        <Card>
          <Text style={s.optLabel}>{t("theme")}</Text>
          <View style={s.optRow}>
            {themeOptions.map((o) => {
              const active = mode === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[s.chip, active ? s.chipActive : null]}
                  onPress={() => setMode(o.key)}
                >
                  <Ionicons
                    name={o.icon}
                    size={16}
                    color={active ? "#fff" : colors.muted}
                  />
                  <Text
                    style={[s.chipText, active ? s.chipTextActive : null]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.optLabel}>{t("language")}</Text>
          <View style={s.optRow}>
            {langOptions.map((o) => {
              const active = lang === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[s.chip, active ? s.chipActive : null]}
                  onPress={() => setLang(o.key)}
                >
                  <Text
                    style={[s.chipText, active ? s.chipTextActive : null]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <PrimaryButton
          label={t("editProfile")}
          icon="create-outline"
          onPress={() => Alert.alert(t("editProfile"), t("comingSoon"))}
        />
        <OutlineButton
          label={t("changePassword")}
          icon="key-outline"
          onPress={() => Alert.alert(t("changePassword"), t("comingSoon"))}
        />
        <PrimaryButton
          label={t("logout")}
          icon="log-out-outline"
          color={colors.danger}
          style={s.logoutBtn}
          onPress={confirmLogout}
        />
      </ScrollView>
    </View>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    avatarWrap: { alignItems: "center", marginVertical: 12 },
    avatar: {
      height: 84,
      width: 84,
      borderRadius: 42,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
    name: { fontSize: 18, fontWeight: "700", color: c.text },
    idText: { fontSize: 13, color: c.muted, marginTop: 2 },
    optLabel: {
      fontSize: 13,
      color: c.muted,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 4,
    },
    optRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.muted, fontWeight: "600", fontSize: 13, marginLeft: 6 },
    chipTextActive: { color: "#fff" },
    logoutBtn: { marginTop: 6 },
  });
}
