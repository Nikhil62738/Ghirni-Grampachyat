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
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config";

// Steps: lookup -> confirm -> otp
export default function ActivateScreen({ navigation }) {
  const { activate } = useAuth();
  const [step, setStep] = useState("lookup");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const msg = (e) =>
    (e && e.response && e.response.data && e.response.data.message) ||
    (e && e.message) ||
    "Something went wrong. Please try again.";

  const lookup = async () => {
    if (!identifier) {
      Alert.alert("Required", "Enter your Email / Mobile / Taxpayer ID.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/taxpayer/lookup", {
        identifier: identifier.trim(),
      });
      const data = res.data.data;
      if (data.isActivated) {
        Alert.alert(
          "Already activated",
          "This account is already active. Please log in instead.",
        );
        navigation.navigate("Login");
        return;
      }
      setMaskedEmail(data.maskedEmail || "");
      setStep("confirm");
    } catch (e) {
      Alert.alert("Not found", msg(e));
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    setBusy(true);
    try {
      await api.post("/auth/taxpayer/request-otp", {
        identifier: identifier.trim(),
      });
      setStep("otp");
      Alert.alert("OTP sent", "An OTP has been sent to " + maskedEmail);
    } catch (e) {
      Alert.alert("Could not send OTP", msg(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!otp || !password) {
      Alert.alert("Required", "Enter the OTP and a new password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await activate(identifier.trim(), otp.trim(), password);
      // On success the user is signed in and the navigator switches to the app.
    } catch (e) {
      Alert.alert("Activation failed", msg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tricolor} />
      <Text style={styles.title}>Activate Taxpayer Account</Text>
      <Text style={styles.subtitle}>Gram Panchayat Ghirni</Text>

      <View style={styles.card}>
        {step === "lookup" && (
          <>
            <Text style={styles.label}>Email / Mobile / Taxpayer ID</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="e.g. GPG-TP-000001"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={lookup}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Search Records</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === "confirm" && (
          <>
            <Text style={styles.info}>
              Your taxpayer record was found. We will send a one-time password
              (OTP) to your registered email {maskedEmail}.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={requestOtp}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === "otp" && (
          <>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit code"
            />
            <Text style={styles.label}>Create Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Create Account</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={requestOtp} disabled={busy}>
              <Text style={styles.link}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already activated? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    padding: 24,
    paddingTop: 50,
  },
  tricolor: { height: 4, width: "100%", backgroundColor: COLORS.saffron },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.gov,
    marginTop: 16,
  },
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
  info: { fontSize: 14, color: COLORS.text, marginBottom: 8, lineHeight: 20 },
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
  link: {
    color: COLORS.gov,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
});
