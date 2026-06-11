import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../config";

// Renders Razorpay Checkout inside a WebView. Unlike the native
// react-native-razorpay module, this works in Expo Go and in EAS builds
// without any extra native configuration.
export default function RazorpayWebView({
  visible,
  order,
  prefill,
  onResult,
  onClose,
}) {
  const html = useMemo(
    () => buildCheckoutHtml(order, prefill),
    [order, prefill],
  );

  const handleMessage = (event) => {
    let payload = null;
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      payload = { event: "error", message: "Invalid response from gateway" };
    }
    onResult(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.bar}>
        <Text style={styles.barTitle}>Secure Payment</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
      {order ? (
        <WebView
          originWhitelist={["*"]}
          source={sourceFor(html)}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          style={styles.web}
        />
      ) : null}
    </Modal>
  );
}

function sourceFor(html) {
  return { html };
}

function buildCheckoutHtml(order, prefill) {
  if (!order) return "<html><body></body></html>";
  const key = JSON.stringify(order.keyId || "");
  const amount = JSON.stringify(order.amount || 0);
  const currency = JSON.stringify(order.currency || "INR");
  const orderId = JSON.stringify(order.orderId || "");
  const name = JSON.stringify((prefill && prefill.name) || "");
  const email = JSON.stringify((prefill && prefill.email) || "");
  const contact = JSON.stringify((prefill && prefill.contact) || "");
  const color = JSON.stringify(COLORS.gov);

  const lines = [
    "<!DOCTYPE html>",
    '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "<style>body{font-family:sans-serif;background:#f1f5f9;margin:0;padding:24px;text-align:center;color:#1f2937;}</style>",
    "</head><body>",
    "<p>Loading secure payment gateway...</p>",
    '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>',
    "<script>",
    "function send(payload){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(payload)); } }",
    "var options = {",
    "  key: " + key + ",",
    "  amount: " + amount + ",",
    "  currency: " + currency + ",",
    '  name: "Gram Panchayat Ghirni",',
    '  description: "Property Tax Payment",',
    "  order_id: " + orderId + ",",
    "  prefill: { name: " +
      name +
      ", email: " +
      email +
      ", contact: " +
      contact +
      " },",
    "  theme: { color: " + color + " },",
    "  handler: function (response) { send({ event: 'success', data: response }); },",
    "  modal: { ondismiss: function () { send({ event: 'dismiss' }); } }",
    "};",
    "try {",
    "  var rzp = new Razorpay(options);",
    "  rzp.on('payment.failed', function (response) { send({ event: 'failed', data: response.error }); });",
    "  rzp.open();",
    "} catch (e) { send({ event: 'error', message: String(e) }); }",
    "</script>",
    "</body></html>",
  ];
  return lines.join("\n");
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gov,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 44,
  },
  barTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancel: { color: "#fff", fontSize: 14 },
  web: { flex: 1 },
});
