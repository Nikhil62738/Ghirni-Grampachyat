import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { useDashboard } from "../context/DashboardContext";
import RazorpayWebView from "../components/RazorpayWebView";
import { AppHeader, PrimaryButton, inr } from "../components/ui";

export default function PayScreen({ navigation }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { reload } = useDashboard();
  const s = useMemo(() => make(colors), [colors]);

  const [due, setDue] = useState(0);
  const [currentTax, setCurrentTax] = useState(0);
  const [profile, setProfile] = useState({});
  const [choice, setChoice] = useState("full"); // full | current | custom
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      const d = res.data.data;
      setDue(d.taxSummary?.totalDue || 0);
      setCurrentTax(d.taxSummary?.currentTax || 0);
      setProfile(d.profile || {});
    } catch (e) {
      // keep previous values
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const amount =
    choice === "full"
      ? Number(due)
      : choice === "current"
        ? Number(currentTax)
        : Number(custom);

  const startPayment = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert(t("invalidAmount"), t("enterAmountGtZero"));
      return;
    }
    if (choice === "custom" && amt > Number(due)) {
      Alert.alert(t("invalidAmount"), t("customMaxDue"));
      return;
    }
    setBusy(true);
    try {
      const orderRes = await api.post("/payments/online/order", { amount: amt });
      setOrder(orderRes.data.data);
      setCheckoutVisible(true);
    } catch (e) {
      Alert.alert(t("couldNotStartPayment"), String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const closeCheckout = () => {
    setCheckoutVisible(false);
    setOrder(null);
  };

  const handleResult = async (payload) => {
    if (!payload || payload.event !== "success") {
      closeCheckout();
      if (payload && payload.event === "failed") {
        const description = payload.data?.description || t("paymentFailedMsg");
        Alert.alert(t("paymentNotCompleted"), String(description));
      }
      return;
    }
    closeCheckout();
    setBusy(true);
    try {
      const resp = payload.data || {};
      await api.post("/payments/online/verify", {
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        razorpaySignature: resp.razorpay_signature,
      });
      await reload();
      navigation.navigate("Receipt", { amount: Number(amount) });
    } catch (e) {
      Alert.alert(t("verificationFailed"), String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const prefill = {
    name: profile.fullName || "",
    email: profile.email || "",
    contact: profile.mobileNumber || "",
  };

  const methods = [
    { icon: "phone-portrait-outline", label: t("upi") },
    { icon: "card-outline", label: t("debitCard") },
    { icon: "card", label: t("creditCard") },
    { icon: "business-outline", label: t("netBanking") },
  ];

  return (
    <View style={s.screen}>
      <AppHeader
        title={t("payTax")}
        subtitle={t("appName")}
        onBell={() => Alert.alert(t("notifications"), t("noNotifications"))}
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.dueCard}>
          <Text style={s.dueLabel}>{t("outstandingDue")}</Text>
          <Text style={s.dueAmount}>{inr(due)}</Text>
        </View>

        <Text style={s.section}>{t("chooseWhatToPay")}</Text>
        <Radio
          s={s}
          colors={colors}
          active={choice === "full"}
          label={t("fullPayment")}
          hint={inr(due)}
          onPress={() => setChoice("full")}
        />
        <Radio
          s={s}
          colors={colors}
          active={choice === "current"}
          label={t("currentYearTax")}
          hint={inr(currentTax)}
          onPress={() => setChoice("current")}
        />
        <Radio
          s={s}
          colors={colors}
          active={choice === "custom"}
          label={t("customAmount")}
          hint={t("orEnterCustomAmount")}
          onPress={() => setChoice("custom")}
        />
        {choice === "custom" ? (
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={custom}
            onChangeText={setCustom}
            placeholder={t("enterAnyAmount")}
            placeholderTextColor={colors.muted}
          />
        ) : null}

        <Text style={s.section}>{t("paymentMethods")}</Text>
        <View style={s.methodRow}>
          {methods.map((m, i) => (
            <View key={i} style={s.method}>
              <Ionicons name={m.icon} size={20} color={colors.primary} />
              <Text style={s.methodText}>{m.label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>{t("paymentMethodsNote")}</Text>

        <View style={s.payRow}>
          <Text style={s.payLabel}>{t("amountToPay")}</Text>
          <Text style={s.payValue}>{inr(amount)}</Text>
        </View>
        <PrimaryButton
          label={t("proceedToSecurePayment")}
          icon="lock-closed"
          color={colors.success}
          loading={busy}
          onPress={startPayment}
        />
        <Text style={s.note}>{t("paymentNote")}</Text>

        <RazorpayWebView
          visible={checkoutVisible}
          order={order}
          prefill={prefill}
          onResult={handleResult}
          onClose={closeCheckout}
        />
      </ScrollView>
    </View>
  );
}

function Radio({ s, colors, active, label, hint, onPress }) {
  return (
    <TouchableOpacity
      style={[s.radio, active ? s.radioActive : null]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={active ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={active ? colors.primary : colors.muted}
      />
      <View style={s.radioText}>
        <Text style={s.radioLabel}>{label}</Text>
        <Text style={s.radioHint}>{hint}</Text>
      </View>
    </TouchableOpacity>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    dueCard: {
      backgroundColor: c.primaryDark,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
    },
    dueLabel: { color: "#dbeafe", fontSize: 13 },
    dueAmount: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 4 },
    section: {
      fontSize: 13,
      fontWeight: "700",
      color: c.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 8,
    },
    radio: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    radioActive: { borderColor: c.primary, backgroundColor: c.cardAlt },
    radioText: { marginLeft: 12, flex: 1 },
    radioLabel: { color: c.text, fontSize: 15, fontWeight: "600" },
    radioHint: { color: c.muted, fontSize: 13, marginTop: 2 },
    input: {
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 12,
      padding: 14,
      backgroundColor: c.card,
      fontSize: 16,
      color: c.text,
      marginBottom: 8,
    },
    methodRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    method: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    methodText: { color: c.text, fontSize: 13, marginLeft: 10, fontWeight: "500" },
    note: { fontSize: 12, color: c.muted, marginTop: 8, lineHeight: 17 },
    payRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14,
      marginBottom: 6,
    },
    payLabel: { color: c.muted, fontSize: 14 },
    payValue: { color: c.text, fontSize: 20, fontWeight: "800" },
  });
}
