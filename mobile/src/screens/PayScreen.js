import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useI18n } from "../context/I18nContext";
import { COLORS } from "../config";
import RazorpayWebView from "../components/RazorpayWebView";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

export default function PayScreen() {
  const { t } = useI18n();
  const [due, setDue] = useState(0);
  const [currentTax, setCurrentTax] = useState(0);
  const [profile, setProfile] = useState({});
  const [amount, setAmount] = useState("");
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
      setAmount(String(d.taxSummary?.totalDue || ""));
    } catch (e) {
      // ignore, keep previous values
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const startPayment = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert(t("invalidAmount"), t("enterAmountGtZero"));
      return;
    }
    setBusy(true);
    try {
      const orderRes = await api.post("/payments/online/order", {
        amount: amt,
      });
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
      Alert.alert(t("paymentSuccessful"), t("paymentSuccessMsg"));
      load();
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

  const fullDueActive = Number(amount) === Number(due) && Number(due) > 0;
  const currentTaxActive =
    Number(amount) === Number(currentTax) && Number(currentTax) > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.dueCard}>
        <Text style={styles.dueLabel}>{t("outstandingDue")}</Text>
        <Text style={styles.dueAmount}>{inr(due)}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t("chooseWhatToPay")}</Text>
      <View style={styles.optionRow}>
        <OptionButton
          label={t("fullDue")}
          amount={inr(due)}
          active={fullDueActive}
          onPress={() => setAmount(String(due))}
        />
        <OptionButton
          label={t("currentYearTax")}
          amount={inr(currentTax)}
          active={currentTaxActive}
          onPress={() => setAmount(String(currentTax))}
        />
      </View>

      <Text style={styles.label}>{t("orEnterCustomAmount")}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder={t("enterAnyAmount")}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={startPayment}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("payNowRazorpay")}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>{t("paymentNote")}</Text>

      <RazorpayWebView
        visible={checkoutVisible}
        order={order}
        prefill={prefill}
        onResult={handleResult}
        onClose={closeCheckout}
      />
    </ScrollView>
  );
}

function OptionButton({ label, amount, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.option, active ? styles.optionActive : null]}
      onPress={onPress}
    >
      <Text
        style={[styles.optionLabel, active ? styles.optionLabelActive : null]}
      >
        {label}
      </Text>
      <Text
        style={[styles.optionAmt, active ? styles.optionLabelActive : null]}
      >
        {amount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16 },
  dueCard: {
    backgroundColor: COLORS.gov,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  dueLabel: { color: "#cbd5e1", fontSize: 13 },
  dueAmount: { color: "#fff", fontSize: 28, fontWeight: "bold", marginTop: 4 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.muted,
    marginBottom: 8,
  },
  optionRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  option: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
  },
  optionActive: { borderColor: COLORS.gov, backgroundColor: "#eef2ff" },
  optionLabel: { fontSize: 13, color: COLORS.muted },
  optionLabelActive: { color: COLORS.gov },
  optionAmt: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 4,
  },
  label: { fontSize: 13, color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.india,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  note: { fontSize: 12, color: COLORS.muted, marginTop: 16 },
});
