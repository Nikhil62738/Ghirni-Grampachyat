import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import PayScreen from "./src/screens/PayScreen";
import ReceiptsScreen from "./src/screens/ReceiptsScreen";
import { COLORS } from "./src/config";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerStyle = { backgroundColor: COLORS.gov };
const headerTint = "#ffffff";
const tabActive = COLORS.gov;

const loginScreenOptions = { headerShown: false };
const tabBarOptions = {
  headerStyle,
  headerTintColor: headerTint,
  tabBarActiveTintColor: tabActive,
};

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Pay Tax" component={PayScreen} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
    </Tab.Navigator>
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

  return (
    <Stack.Navigator>
      {user ? (
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={loginScreenOptions}
        />
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={loginScreenOptions}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = {
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
};
