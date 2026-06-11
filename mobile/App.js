import "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { I18nProvider, useI18n } from "./src/context/I18nContext";
import { DashboardProvider } from "./src/context/DashboardContext";
import { COLORS } from "./src/config";

import LoginScreen from "./src/screens/LoginScreen";
import ActivateScreen from "./src/screens/ActivateScreen";
import HomeScreen from "./src/screens/HomeScreen";
import TaxSummaryScreen from "./src/screens/TaxSummaryScreen";
import TaxHistoryScreen from "./src/screens/TaxHistoryScreen";
import PaymentHistoryScreen from "./src/screens/PaymentHistoryScreen";
import PayScreen from "./src/screens/PayScreen";
import CustomDrawer from "./src/components/CustomDrawer";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const headerStyle = { backgroundColor: COLORS.gov };
const headerTint = "#ffffff";
const hiddenHeader = { headerShown: false };

const drawerScreenOptions = {
  headerStyle: headerStyle,
  headerTintColor: headerTint,
  drawerActiveTintColor: COLORS.gov,
  drawerActiveBackgroundColor: "#eef2ff",
  drawerInactiveTintColor: COLORS.text,
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeader}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Activate" component={ActivateScreen} />
    </Stack.Navigator>
  );
}

function renderDrawer(props) {
  return <CustomDrawer {...props} />;
}

function AppDrawer() {
  const { t } = useI18n();

  const homeOptions = { title: t("home"), headerTitle: t("appName") };
  const taxSummaryOptions = { title: t("taxSummary") };
  const taxHistoryOptions = { title: t("taxHistory") };
  const paymentHistoryOptions = { title: t("paymentHistory") };
  const payOptions = { title: t("payTax") };

  return (
    <Drawer.Navigator
      drawerContent={renderDrawer}
      screenOptions={drawerScreenOptions}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={homeOptions} />
      <Drawer.Screen
        name="TaxSummary"
        component={TaxSummaryScreen}
        options={taxSummaryOptions}
      />
      <Drawer.Screen
        name="TaxHistory"
        component={TaxHistoryScreen}
        options={taxHistoryOptions}
      />
      <Drawer.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={paymentHistoryOptions}
      />
      <Drawer.Screen name="PayTax" component={PayScreen} options={payOptions} />
    </Drawer.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gov} />
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  return (
    <DashboardProvider>
      <AppDrawer />
    </DashboardProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <I18nProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Root />
          </NavigationContainer>
        </AuthProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
