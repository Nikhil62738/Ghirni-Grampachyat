import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../config";

export const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "-";

export function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Field({ label, value }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "-"}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.outlineBtn, style]} onPress={onPress}>
      <Text style={styles.outlineBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyText({ children }) {
  return <Text style={styles.empty}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gov,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fieldLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  fieldValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  primaryBtn: {
    backgroundColor: COLORS.gov,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.gov,
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
    marginTop: 10,
  },
  outlineBtnText: { color: COLORS.gov, fontWeight: "bold", fontSize: 15 },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 16 },
});
