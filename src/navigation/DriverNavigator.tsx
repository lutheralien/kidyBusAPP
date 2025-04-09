// src/navigation/AdminNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { AdminStackParamList } from "../types/navigation.types";

// Import screens

import { ROUTES } from "../constants/routes";
import { SettingsScreen, DriverDashboardScreen } from "../screens";

const Stack = createStackNavigator<AdminStackParamList>();

const DriverNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.DRIVER_DASHBOARD}
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name={ROUTES.DRIVER_DASHBOARD}
        component={DriverDashboardScreen}
        options={{ title: "Driver Dashboard" }}
      />
      <Stack.Screen
        name={ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;
