import React, { useEffect, useState } from "react";
import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import StudentDashboard from "../screens/StudentDashboard";
import PracticeScreen from "../screens/PracticeScreen";
import TestScreen from "../screens/TestScreen";
import ResultsScreen from "../screens/ResultsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Types
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  TestDetail: { testId: string };
  ResultDetail: { testId: string };
};

export type MainTabsParamList = {
  Dashboard: undefined;
  Practice: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Auth Navigation
const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigation
const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: true,
      tabBarActiveTintColor: "#2196F3",
      tabBarInactiveTintColor: "#999",
      tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#ddd",
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={StudentDashboard}
      options={{
        title: "Dashboard",
        tabBarLabel: "Home",
        tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
      }}
    />
    <Tab.Screen
      name="Practice"
      component={PracticeScreen}
      options={{
        title: "Practice Questions",
        tabBarLabel: "Practice",
        tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} />,
      }}
    />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        title: "My Performance",
        tabBarLabel: "Analytics",
        tabBarIcon: ({ color }) => <TabIcon icon="📈" color={color} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        title: "Settings",
        tabBarLabel: "Settings",
        tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
      }}
    />
  </Tab.Navigator>
);

// App Navigation
const AppNavigator: React.FC = () => (
  <AppStack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
    }}
  >
    <AppStack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="TestDetail"
      component={TestScreen}
      options={({ route }) => ({
        title: "Test",
        headerShown: true,
      })}
    />
    <AppStack.Screen
      name="ResultDetail"
      component={ResultsScreen}
      options={{
        title: "Results",
        headerShown: true,
        gestureEnabled: false, // Prevent back gesture after test
      }}
    />
  </AppStack.Navigator>
);

// Root Navigation
const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Check if user is signed in
      const authCredentials = await AsyncStorage.getItem("authCredentials");
      setIsSignedIn(!!authCredentials);
    } catch (error) {
      console.error("Failed to check authentication:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      {isSignedIn ? (
        <RootStack.Screen
          name="App"
          component={AppNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      ) : (
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      )}
    </RootStack.Navigator>
  );
};

interface TabIconProps {
  icon: string;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color }) => (
  <View style={{ fontSize: 20, opacity: color === "#999" ? 0.5 : 1 }}>
    {icon}
  </View>
);

// Navigation Container
export const NavigationRoot: React.FC = () => (
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
);

export default NavigationRoot;
