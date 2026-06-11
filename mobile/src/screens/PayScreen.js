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
import { COLORS } from "../config";
import RazorpayWebView from "../components/RazorpayWebView";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

export default function PayScreen() {
  const [due, setDue] = useState(0);
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
      Alert.alert("Invalid amount", "Enter an amount greater than zero.");
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
      Alert.alert("Could not start payment", String(e.message || e));
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
        const msg =
          payload.data?.description || "Payment failed. Please try again.";
        Alert.alert("Payment not completed", String(msg));
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
      Alert.alert(
        "Payment successful",
        "Your payment is recorded. The digital receipt has been emailed to you and is available in the Receipts tab.",
      );
      load();
    } catch (e) {
      Alert.alert("Verification failed", String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const prefill = {
    name: profile.fullName || "",
    email: profile.email || "",
    contact: profile.mobileNumber || "",
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.dueCard}>
        <Text style={styles.dueLabel}>Outstanding Due</Text>
        <Text style={styles.dueAmount}>{inr(due)}</Text>
      </View>

      <Text style={styles.label}>Amount to pay</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter any amount"
      />
      <Text style={styles.hint}>
        You can pay the full due or enter a custom amount.
      </Text>

      <View style={styles.quickRow}>
        <QuickButton label="Full Due" onPress={() => setAmount(String(due))} />
        <QuickButton
          label="+500"
          onPress={() => setAmount(String((Number(amount) || 0) + 500))}
        />
        <QuickButton
          label="+1000"
          onPress={() => setAmount(String((Number(amount) || 0) + 1000))}
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={startPayment}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay Now with Razorpay</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Payments are processed securely via Razorpay. A digital receipt with a
        QR code is emailed to you after a successful payment.
      </Text>

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

function QuickButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickBtnText}>{label}</Text>
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
  label: { fontSize: 13, color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gov,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickBtnText: { color: COLORS.gov, fontWeight: "600" },
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
