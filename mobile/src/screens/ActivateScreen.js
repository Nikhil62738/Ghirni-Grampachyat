import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton } from "../components/ui";

export default function ActivateScreen({ navigation }) {
  const { activate } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);

  const [step, setStep] = useState(1);
  const [taxpayerId, setTaxpayerId] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!taxpayerId) {
      Alert.alert(t("required"), t("enterIdOnly"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/taxpayer/activate/start", {
        taxpayerId: taxpayerId.trim(),
      });
      const to = res.data?.data?.sentTo || "";
      Alert.alert(t("otpSent"), t("otpSentTo") + " " + to);
      setStep(2);
    } catch (e) {
      Alert.alert(t("couldNotSendOtp"), String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!otp || !password) {
      Alert.alert(t("required"), t("enterOtpAndPassword"));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t("weakPassword"), t("passwordMin6"));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t("mismatch"), t("passwordsNoMatch"));
      return;
    }
    setBusy(true);
    try {
      await activate(taxpayerId.trim(), otp.trim(), password);
    } catch (e) {
      Alert.alert(t("activationFailed"), String(e.message || e));
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
        <Text style={s.title}>{t("activateAccount")}</Text>
        <Text style={s.subtitle}>{t("newTaxpayerNote")}</Text>

        <View style={s.card}>
          {step === 1 ? (
            <View>
              <Text style={s.label}>{t("idLabel")}</Text>
              <TextInput
                style={s.input}
                value={taxpayerId}
                onChangeText={setTaxpayerId}
                placeholder={t("idPlaceholder")}
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
              />
              <PrimaryButton
                label={t("sendOtp")}
                icon="mail-outline"
                loading={busy}
                onPress={sendOtp}
              />
            </View>
          ) : (
            <View>
              <Text style={s.label}>{t("enterOtp")}</Text>
              <TextInput
                style={s.input}
                value={otp}
                onChangeText={setOtp}
                placeholder={t("otpPlaceholder")}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              <Text style={s.label}>{t("createPassword")}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t("atLeast6")}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
              <Text style={s.label}>{t("confirmPassword")}</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder={t("reEnterPassword")}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
              <PrimaryButton
                label={t("verifyCreateAccount")}
                icon="checkmark-circle-outline"
                color={colors.success}
                loading={busy}
                onPress={verify}
              />
              <TouchableOpacity onPress={sendOtp} style={s.resend}>
                <Text style={s.resendText}>{t("resendOtp")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={s.back}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.backText}>{t("alreadyActivated")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 22, paddingTop: 70, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: "800", color: c.text },
    subtitle: { fontSize: 13, color: c.muted, marginTop: 6, marginBottom: 20 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
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
    resend: { alignItems: "center", marginTop: 14 },
    resendText: { color: c.primary, fontWeight: "600" },
    back: { alignItems: "center", marginTop: 22 },
    backText: { color: c.primary, fontWeight: "700", fontSize: 15 },
  });
}
