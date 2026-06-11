import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton } from "../components/ui";

const logo = require("../../assets/logo.png");

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);

  const [taxpayerId, setTaxpayerId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!taxpayerId || !password) {
      Alert.alert(t("required"), t("enterIdAndPassword"));
      return;
    }
    setBusy(true);
    try {
      await login(taxpayerId.trim(), password);
    } catch (e) {
      Alert.alert(t("loginFailed"), String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.brand}>
          <View style={s.logoWrap}>
            <Image source={logo} style={s.logo} resizeMode="contain" />
          </View>
          <Text style={s.title}>{t("appName")}</Text>
          <Text style={s.subtitle}>{t("govLine")}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{t("login")}</Text>
          <Text style={s.label}>{t("idLabel")}</Text>
          <TextInput
            style={s.input}
            value={taxpayerId}
            onChangeText={setTaxpayerId}
            placeholder={t("idPlaceholder")}
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
          />
          <Text style={s.label}>{t("password")}</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t("passwordPlaceholder")}
            placeholderTextColor={colors.muted}
            secureTextEntry
          />
          <PrimaryButton
            label={t("login")}
            icon="log-in-outline"
            loading={busy}
            onPress={onLogin}
            style={s.loginBtn}
          />
        </View>

        <View style={s.activateCard}>
          <Text style={s.activateNote}>{t("newTaxpayerNote")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Activate")}>
            <Text style={s.activateLink}>{t("activateNewAccount")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 22, paddingTop: 70, paddingBottom: 40 },
    brand: { alignItems: "center", marginBottom: 28 },
    logoWrap: {
      height: 96,
      width: 96,
      borderRadius: 48,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      shadowColor: c.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    logo: { height: 84, width: 84, borderRadius: 42 },
    title: { fontSize: 20, fontWeight: "800", color: c.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: c.muted, marginTop: 4 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardTitle: { fontSize: 17, fontWeight: "700", color: c.text, marginBottom: 14 },
    label: { fontSize: 13, color: c.muted, marginBottom: 6, fontWeight: "600" },
    input: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.cardAlt,
      marginBottom: 14,
    },
    loginBtn: { marginTop: 4 },
    activateCard: { alignItems: "center", marginTop: 22 },
    activateNote: { color: c.muted, fontSize: 13, marginBottom: 6 },
    activateLink: { color: c.primary, fontWeight: "700", fontSize: 15 },
  });
}
