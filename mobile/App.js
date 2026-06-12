import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { I18nProvider, useI18n } from "./src/context/I18nContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { DashboardProvider } from "./src/context/DashboardContext";

import LoginScreen from "./src/screens/LoginScreen";
import ActivateScreen from "./src/screens/ActivateScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PayScreen from "./src/screens/PayScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import TaxSummaryScreen from "./src/screens/TaxSummaryScreen";
import ReceiptScreen from "./src/screens/ReceiptScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline" },
  PayTax: { active: "card", inactive: "card-outline" },
  History: { active: "document-text", inactive: "document-text-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

function renderTabIcon(routeName, focused, color, size) {
  const set = TAB_ICONS[routeName] || TAB_ICONS.Home;
  const iconName = focused ? set.active : set.inactive;
  return <Ionicons name={iconName} size={size} color={color} />;
}

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const screenOptions = ({ route }) => {
    const tabBarIcon = ({ focused, color, size }) =>
      renderTabIcon(route.name, focused, color, size);
    const tabBarStyle = {
      backgroundColor: colors.card,
      borderTopColor: colors.border,
      height: 62,
      paddingBottom: 8,
      paddingTop: 6,
    };
    return {
      headerShown: false,
      tabBarIcon,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle,
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    };
  };

  const homeOptions = { title: t("home") };
  const payOptions = { title: t("payTax") };
  const historyOptions = { title: t("history") };
  const profileOptions = { title: t("profile") };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={homeOptions} />
      <Tab.Screen name="PayTax" component={PayScreen} options={payOptions} />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={historyOptions}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={profileOptions}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors, dark } = useTheme();
  const { t } = useI18n();
  const s = useMemo(() => make(colors), [colors]);

  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [dark, colors]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerStyle = { backgroundColor: colors.primary };
  const taxSummaryOptions = {
    headerShown: true,
    title: t("taxSummary"),
    headerStyle,
    headerTintColor: "#fff",
  };
  const receiptOptions = {
    headerShown: true,
    title: t("receipts"),
    headerStyle,
    headerTintColor: "#fff",
  };
  const notificationsOptions = {
    headerShown: true,
    title: t("notifications"),
    headerStyle,
    headerTintColor: "#fff",
  };
  const tabsOptions = { headerShown: false };

  return (
    <NavigationContainer theme={navTheme}>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={tabsOptions}
          />
          <Stack.Screen
            name="TaxSummary"
            component={TaxSummaryScreen}
            options={taxSummaryOptions}
          />
          <Stack.Screen
            name="Receipt"
            component={ReceiptScreen}
            options={receiptOptions}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={notificationsOptions}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={tabsOptions}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Activate" component={ActivateScreen} />
        </AuthStack.Navigator>
      )}
      <StatusBar style={dark ? "light" : "dark"} />
    </NavigationContainer>
  );
}

function ThemedApp() {
  return (
    <DashboardProvider>
      <AppNavigator />
    </DashboardProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <ThemedApp />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

function make(c) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.bg,
    },
  });
}
