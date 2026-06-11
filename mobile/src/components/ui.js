import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";
import { RADIUS } from "../config";

const logo = require("../../assets/logo.png");

export const inr = (n) =>
  "\u20B9 " + Number(n || 0).toLocaleString("en-IN");
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "-";

export function useColors() {
  return useTheme().colors;
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => make(colors), [colors]);
}

export function Card({ title, right, children, style }) {
  const s = useStyles();
  return (
    <View style={[s.card, style]}>
      {title ? (
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>{title}</Text>
          {right || null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function SectionTitle({ children, style }) {
  const s = useStyles();
  return <Text style={[s.sectionTitle, style]}>{children}</Text>;
}

export function Field({ label, value, valueColor, last }) {
  const s = useStyles();
  const rowStyle = last ? s.fieldRowLast : s.fieldRow;
  const vStyle = valueColor ? { color: valueColor } : null;
  const shown = value === 0 || value ? value : "-";
  return (
    <View style={rowStyle}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={[s.fieldValue, vStyle]}>{shown}</Text>
    </View>
  );
}

export function Badge({ label, tone }) {
  const { colors } = useTheme();
  const s = useStyles();
  const map = {
    paid: colors.success,
    pending: colors.saffron,
    overdue: colors.danger,
    neutral: colors.muted,
  };
  const color = map[tone] || colors.muted;
  const wrap = { backgroundColor: color + "22", borderColor: color };
  const txt = { color };
  return (
    <View style={[s.badge, wrap]}>
      <Text style={[s.badgeText, txt]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  color,
  icon,
  style,
  disabled,
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const bg = { backgroundColor: color || colors.primary };
  const dim = disabled ? s.btnDim : null;
  return (
    <TouchableOpacity
      style={[s.primaryBtn, bg, dim, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={s.btnRow}>
          {icon ? (
            <Ionicons name={icon} size={18} color="#fff" style={s.btnIcon} />
          ) : null}
          <Text style={s.primaryBtnText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, icon, style }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <TouchableOpacity
      style={[s.outlineBtn, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.btnRow}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={colors.primary}
            style={s.btnIcon}
          />
        ) : null}
        <Text style={s.outlineBtnText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function StatCard({ label, value, tone }) {
  const { colors } = useTheme();
  const s = useStyles();
  const toneColor =
    tone === "due"
      ? colors.danger
      : tone === "paid"
        ? colors.success
        : tone === "prev"
          ? colors.saffron
          : colors.primary;
  const stripe = { backgroundColor: toneColor };
  const vColor = { color: toneColor };
  return (
    <View style={s.stat}>
      <View style={[s.statStripe, stripe]} />
      <Text style={s.statLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[s.statValue, vColor]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function ProgressBar({ percent }) {
  const s = useStyles();
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const fill = { width: p + "%" };
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, fill]} />
    </View>
  );
}

export function QuickAction({ icon, label, color, onPress }) {
  const { colors } = useTheme();
  const s = useStyles();
  const ic = color || colors.primary;
  const iconWrap = { backgroundColor: ic + "1A" };
  return (
    <TouchableOpacity style={s.qa} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.qaIcon, iconWrap]}>
        <Ionicons name={icon} size={22} color={ic} />
      </View>
      <Text style={s.qaLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon, text }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={s.empty}>
      <Ionicons
        name={icon || "document-text-outline"}
        size={42}
        color={colors.muted}
      />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function Skeleton({ height, width, style }) {
  const s = useStyles();
  const dim = { height: height || 16, width: width || "100%" };
  return <View style={[s.skeleton, dim, style]} />;
}

export function AppHeader({ title, subtitle, onBell }) {
  const s = useStyles();
  const { lang, setLang } = useI18n();
  const enActive = lang === "en";
  const nextLangLabel = enActive ? "\u092e\u0930\u093e\u0920\u0940" : "EN";
  return (
    <View style={s.header}>
      <View style={s.headerStripe} />
      <View style={s.headerRow}>
        <View style={s.logoWrap}>
          <Image source={logo} style={s.headerLogo} resizeMode="contain" />
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.headerSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={onBell}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.langPill}
          onPress={() => setLang(enActive ? "mr" : "en")}
        >
          <Text style={s.langPillText}>{nextLangLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function make(c) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: RADIUS,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: c.text },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 4,
    },
    fieldRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    fieldRowLast: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 9,
    },
    fieldLabel: { color: c.muted, fontSize: 13, flex: 1 },
    fieldValue: {
      color: c.text,
      fontSize: 13,
      fontWeight: "600",
      flex: 1,
      textAlign: "right",
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    badgeText: { fontSize: 12, fontWeight: "700" },
    primaryBtn: {
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    btnDim: { opacity: 0.6 },
    btnRow: { flexDirection: "row", alignItems: "center" },
    btnIcon: { marginRight: 8 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    outlineBtn: {
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 12,
      paddingVertical: 13,
      paddingHorizontal: 16,
      alignItems: "center",
      marginTop: 10,
      backgroundColor: "transparent",
    },
    outlineBtnText: { color: c.primary, fontWeight: "700", fontSize: 15 },
    stat: {
      width: "48%",
      backgroundColor: c.card,
      borderRadius: RADIUS,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
      shadowColor: c.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    statStripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    statLabel: { color: c.muted, fontSize: 12, marginBottom: 6 },
    statValue: { fontSize: 18, fontWeight: "700" },
    progressTrack: {
      height: 12,
      borderRadius: 999,
      backgroundColor: c.cardAlt,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: c.success,
    },
    qa: { width: "31%", alignItems: "center", marginBottom: 16 },
    qaIcon: {
      height: 56,
      width: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    qaLabel: {
      fontSize: 12,
      color: c.text,
      textAlign: "center",
      fontWeight: "500",
    },
    empty: { alignItems: "center", paddingVertical: 28 },
    emptyText: { color: c.muted, marginTop: 10, fontSize: 14 },
    skeleton: {
      backgroundColor: c.cardAlt,
      borderRadius: 10,
      marginBottom: 10,
    },
    header: { backgroundColor: c.primary },
    headerStripe: { height: 4, backgroundColor: c.saffron },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingTop: 46,
      paddingBottom: 14,
    },
    logoWrap: {
      height: 42,
      width: 42,
      borderRadius: 21,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    headerLogo: { height: 38, width: 38 },
    headerTextWrap: { flex: 1, marginLeft: 10 },
    headerTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
    headerSub: { color: "#dbeafe", fontSize: 11, marginTop: 1 },
    iconBtn: {
      height: 38,
      width: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    langPill: {
      borderWidth: 1,
      borderColor: "#ffffff66",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginLeft: 2,
    },
    langPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  });
}
