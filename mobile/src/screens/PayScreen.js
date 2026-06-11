import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import RazorpayCheckout from "react-native-razorpay";
import api from "../api/client";
import { COLORS } from "../config";

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");

export default function PayScreen() {
  const [due, setDue] = useState(0);
  const [profile, setProfile] = useState({});
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/taxpayers/me/dashboard");
      const d = res.data.data;
      setDue(d.taxSummary?.totalDue || 0);
      setProfile(d.profile || {});
      setAmount(String(d.taxSummary?.totalDue || ""));
    } catch (e) {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pay = async () => {
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
      const order = orderRes.data.data;

      const prefill = {
        email: profile.email || "",
        contact: profile.mobileNumber || "",
        name: profile.fullName || "",
      };
      const options = {
        description: "Property Tax Payment",
        currency: order.currency || "INR",
        key: order.keyId,
        amount: order.amount,
        order_id: order.orderId,
        name: "Gram Panchayat Ghirni",
        prefill,
        theme: { color: COLORS.gov },
      };

      const result = await RazorpayCheckout.open(options);

      await api.post("/payments/online/verify", {
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      Alert.alert(
        "Payment successful",
        "Your payment is recorded. The digital receipt has been emailed to you.",
      );
      load();
    } catch (e) {
      const msg =
        e?.description || e?.message || "Payment was cancelled or failed.";
      Alert.alert("Payment not completed", String(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
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
        placeholder="Enter amount"
      />

      <TouchableOpacity style={styles.button} onPress={pay} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay Online</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Payments are processed securely via Razorpay. A digital receipt with a
        QR code is emailed to you after a successful payment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
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
  },
  button: {
    backgroundColor: COLORS.india,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  note: { fontSize: 12, color: COLORS.muted, marginTop: 16 },
});
