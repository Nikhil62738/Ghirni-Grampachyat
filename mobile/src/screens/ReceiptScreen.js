import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDashboard } from "../context/DashboardContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config";
import {
  Card,
  Field,
  PrimaryButton,
  OutlineButton,
  EmptyState,
  inr,
  fmtDate,
} from "../components/ui";

export default function ReceiptScreen({ navigation }) {
  const { data } = useDashboard();
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);
  const scale = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 500,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const receipts = data?.receipts || [];
  const profile = data?.profile || {};
  const receipt = receipts[0];

  if (!receipt) {
    return (
      <View style={s.screen}>
        <Card>
          <EmptyState icon="receipt-outline" text={t("noReceiptYet")} />
        </Card>
        <PrimaryButton
          label={t("backToDashboard")}
          icon="home"
          onPress={() => navigation.navigate("MainTabs")}
        />
      </View>
    );
  }

  const qrData = encodeURIComponent(
    "Receipt: " +
      (receipt.receiptNumber || "") +
      " | Amount: " +
      (receipt.amount || "") +
      " | " +
      (receipt.transactionId || ""),
  );
  const qrUri =
    "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + qrData;
  const qrSource = { uri: qrUri };
  const animStyle = { transform: [{ scale }] };

  const downloadReceipt = async () => {
    setBusy(true);
    try {
      const token = await AsyncStorage.getItem("gp_token");
      const safeName =
        String(receipt.receiptNumber || "receipt").replace(
          /[^a-zA-Z0-9]/g,
          "_",
        ) + ".pdf";
      const target = FileSystem.cacheDirectory + safeName;
      const result = await FileSystem.downloadAsync(
        API_BASE_URL + "/receipts/" + receipt._id + "/download",
        target,
        { headers: { Authorization: "Bearer " + token } },
      );
      if (result.status && result.status >= 400)
        throw new Error("HTTP " + result.status);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
      } else {
        Alert.alert(t("downloaded"), result.uri);
      }
    } catch (e) {
      Alert.alert(t("downloadFailed"), String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Animated.View style={[s.successWrap, animStyle]}>
        <View style={s.successCircle}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
      </Animated.View>
      <Text style={s.successTitle}>{t("paymentSuccessful")}</Text>
      <Text style={s.successSub}>{t("paymentSuccessMsg")}</Text>

      <Card>
        <Field label={t("receiptNumber")} value={receipt.receiptNumber} />
        <Field
          label={t("transactionId")}
          value={receipt.transactionId || receipt._id}
        />
        <Field label={t("date")} value={fmtDate(receipt.createdAt)} />
        <Field
          label={t("amount")}
          value={inr(receipt.amount)}
          valueColor={colors.success}
        />
        <Field label={t("taxpayerName")} value={profile.fullName} />
        <Field
          label={t("propertyId")}
          value={profile.propertyNumber || profile.taxpayerId}
        />
        <Field label={t("paymentMode")} value={"Razorpay"} last />
      </Card>

      <Card title={t("scanToVerify")}>
        <View style={s.qrWrap}>
          <Image source={qrSource} style={s.qr} />
        </View>
      </Card>

      <PrimaryButton
        label={t("downloadReceiptPdf")}
        icon="download"
        color={colors.success}
        loading={busy}
        onPress={downloadReceipt}
      />
      <OutlineButton
        label={t("backToDashboard")}
        icon="home"
        onPress={() => navigation.navigate("MainTabs")}
      />
    </ScrollView>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    successWrap: { alignItems: "center", marginTop: 12, marginBottom: 12 },
    successCircle: {
      height: 86,
      width: 86,
      borderRadius: 43,
      backgroundColor: c.success,
      alignItems: "center",
      justifyContent: "center",
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
    },
    successSub: {
      fontSize: 13,
      color: c.muted,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 18,
    },
    qrWrap: { alignItems: "center", paddingVertical: 8 },
    qr: {
      height: 180,
      width: 180,
      backgroundColor: "#fff",
      borderRadius: 12,
    },
  });
}
