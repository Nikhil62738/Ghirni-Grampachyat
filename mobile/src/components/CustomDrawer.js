import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config";

export default function CustomDrawer(props) {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();

  const displayName = user ? user.fullName || user.name || "" : "";

  return (
    <View style={styles.flex}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.tricolor} />
          <View style={styles.emblem}>
            <Text style={styles.emblemText}>GP</Text>
          </View>
          <Text style={styles.appName}>{t("appName")}</Text>
          <Text style={styles.govLine}>{t("govLine")}</Text>
          {displayName ? <Text style={styles.user}>{displayName}</Text> : null}
        </View>
        <View style={styles.items}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Text style={styles.langLabel}>{t("language")}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === "en" ? styles.langActive : null]}
            onPress={() => setLang("en")}
          >
            <Text
              style={[
                styles.langText,
                lang === "en" ? styles.langTextActive : null,
              ]}
            >
              {t("english")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === "mr" ? styles.langActive : null]}
            onPress={() => setLang("mr")}
          >
            <Text
              style={[
                styles.langText,
                lang === "mr" ? styles.langTextActive : null,
              ]}
            >
              {t("marathi")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 0 },
  header: {
    backgroundColor: COLORS.gov,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tricolor: {
    height: 4,
    marginHorizontal: -16,
    backgroundColor: COLORS.saffron,
    marginBottom: 16,
  },
  emblem: {
    height: 52,
    width: 52,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  emblemText: { color: COLORS.gov, fontSize: 18, fontWeight: "bold" },
  appName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  govLine: { color: "#cbd5e1", fontSize: 12, marginTop: 2 },
  user: { color: "#e2e8f0", fontSize: 13, marginTop: 8, fontWeight: "600" },
  items: { paddingTop: 4 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
  },
  langLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
    fontWeight: "600",
  },
  langRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  langActive: { borderColor: COLORS.gov, backgroundColor: "#eef2ff" },
  langText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  langTextActive: { color: COLORS.gov },
  logout: {
    backgroundColor: COLORS.gov,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
});
