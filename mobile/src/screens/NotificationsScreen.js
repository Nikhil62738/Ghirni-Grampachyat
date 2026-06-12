import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { RADIUS } from "../config";

const TYPE_ICON = {
  due_reminder: "alert-circle",
  payment_success: "checkmark-circle",
  receipt_generated: "receipt",
  tax_generated: "document-text",
  penalty_applied: "warning",
  account_activated: "person-circle",
};

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8377;|&rupee;/gi, "\u20B9")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeType(type, t) {
  const key = "notifType_" + type;
  const label = t(key);
  // If no translation exists, fall back to a readable version of the key.
  if (label && label !== key) return label;
  return String(type || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useMemo(() => make(colors), [colors]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/taxpayers/me/notifications");
      const list = res.data.data.items || [];
      setItems(list);
      // Mark everything as read once the taxpayer opens this screen.
      if ((res.data.data.unread || 0) > 0) {
        api.post("/taxpayers/me/notifications/read", {}).catch(() => {});
      }
    } catch (e) {
      setError(e.message || t("loadingFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      >
        {error ? <Text style={s.error}>{error}</Text> : null}

        {!loading && items.length === 0 ? (
          <View style={s.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={colors.muted}
            />
            <Text style={s.emptyText}>{t("noNotificationsYet")}</Text>
          </View>
        ) : null}

        {items.map((n) => {
          const icon = TYPE_ICON[n.type] || "notifications";
          const unread = !n.read;
          return (
            <View key={n._id} style={[s.item, unread ? s.itemUnread : null]}>
              <View style={s.iconWrap}>
                <Ionicons name={icon} size={20} color={colors.primary} />
              </View>
              <View style={s.itemBody}>
                <View style={s.itemHead}>
                  <Text style={s.itemTitle} numberOfLines={1}>
                    {n.subject || humanizeType(n.type, t)}
                  </Text>
                  {unread ? <View style={s.dot} /> : null}
                </View>
                {n.message ? (
                  <Text style={s.itemMsg} numberOfLines={4}>
                    {stripHtml(n.message)}
                  </Text>
                ) : null}
                <Text style={s.itemDate}>
                  {new Date(n.createdAt).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function make(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 32 },
    error: { color: c.danger, marginBottom: 12, fontSize: 13 },
    empty: { alignItems: "center", marginTop: 80 },
    emptyText: { color: c.muted, fontSize: 14, marginTop: 12 },
    item: {
      flexDirection: "row",
      backgroundColor: c.card,
      borderRadius: RADIUS,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    itemUnread: { borderColor: c.primary, backgroundColor: c.cardAlt },
    iconWrap: {
      height: 38,
      width: 38,
      borderRadius: 19,
      backgroundColor: c.cardAlt,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    itemBody: { flex: 1 },
    itemHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemTitle: { color: c.text, fontSize: 15, fontWeight: "700", flex: 1 },
    dot: {
      height: 9,
      width: 9,
      borderRadius: 5,
      backgroundColor: c.danger,
      marginLeft: 8,
    },
    itemMsg: { color: c.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    itemDate: { color: c.muted, fontSize: 11, marginTop: 8 },
  });
}
