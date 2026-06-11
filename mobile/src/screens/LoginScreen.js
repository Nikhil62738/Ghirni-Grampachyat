import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { COLORS } from "../config";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!identifier || !password) {
      Alert.alert(t("required"), t("enterIdAndPassword"));
      return;
    }
    setBusy(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      Alert.alert(t("loginFailed"), e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tricolor} />

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

      <View style={styles.emblem}>
        <Text style={styles.emblemText}>GP</Text>
      </View>
      <Text style={styles.govLine}>{t("govLine")}</Text>
      <Text style={styles.title}>{t("appName")}</Text>
      <Text style={styles.subtitle}>{t("citizenServices")}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t("idLabel")}</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={t("idPlaceholder")}
        />
        <Text style={styles.label}>{t("password")}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder={t("passwordPlaceholder")}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("login")}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate("Activate")}
          disabled={busy}
        >
          <Text style={styles.outlineButtonText}>
            {t("activateNewAccount")}
          </Text>
        </TouchableOpacity>
        <Text style={styles.note}>{t("newTaxpayerNote")}</Text>
      </View>

      <Text style={styles.footer}>{t("footerAddress")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  tricolor: { height: 4, width: "100%", backgroundColor: COLORS.saffron },
  langRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  langBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  langActive: { borderColor: COLORS.gov, backgroundColor: "#eef2ff" },
  langText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  langTextActive: { color: COLORS.gov },
  emblem: {
    height: 64,
    width: 64,
    borderRadius: 16,
    backgroundColor: COLORS.gov,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  emblemText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  govLine: { marginTop: 12, fontSize: 12, color: COLORS.muted },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.gov },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderTopWidth: 4,
    borderTopColor: COLORS.saffron,
    elevation: 2,
  },
  label: { fontSize: 13, color: COLORS.text, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: COLORS.gov,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.gov,
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
    marginTop: 12,
  },
  outlineButtonText: { color: COLORS.gov, fontWeight: "bold", fontSize: 15 },
  note: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 12,
    textAlign: "center",
  },
  footer: { marginTop: 24, fontSize: 12, color: COLORS.muted },
});
