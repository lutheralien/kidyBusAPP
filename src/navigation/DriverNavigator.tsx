import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DriverStackParamList } from "../types/navigation.types";
import { ROUTES } from "../constants/routes";
import {
  SettingsScreen,
  DriverDashboardScreen,
  ProfileScreen,
  DriversTodaysTripsScreen,
  DriverMapScreen, // Import the new map screen component
} from "../screens";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";

type DriverTabParamList = {
  [ROUTES.DRIVER_DASHBOARD]: undefined;
  [ROUTES.DRIVERS_TODAYS_TRIPS]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

// Create both Stack and Tab navigators
const Stack = createStackNavigator<DriverStackParamList>();
const Tab = createBottomTabNavigator<DriverTabParamList>();

// Tab Navigator Component
const DriverTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }: {
        route: RouteProp<DriverTabParamList, keyof DriverTabParamList>;
      }) => ({
        headerShown: false, // Show header for tabs, you can set to false if you prefer no headers
        tabBarIcon: ({
          focused,
          color,
          size,
        }: {
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let iconName: string = "help-circle"; // Default icon

          if (route.name === ROUTES.DRIVER_DASHBOARD) {
            iconName = focused ? "car" : "car-outline";
          } else if (route.name === ROUTES.DRIVERS_TODAYS_TRIPS) {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === ROUTES.SETTINGS) {
            iconName = focused ? "settings" : "settings-outline";
          }

          // Return the icon component
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name={ROUTES.DRIVER_DASHBOARD}
        component={DriverDashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name={ROUTES.DRIVERS_TODAYS_TRIPS}
        component={DriversTodaysTripsScreen}
        options={{ title: "Today's Trips" }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

const DriverNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.DRIVER_TAB} component={DriverTabNavigator} />
      
      {/* Add the Map Screen to the Stack Navigator */}
      <Stack.Screen 
        name={ROUTES.DRIVER_MAP} 
        component={DriverMapScreen}
        options={{
          headerShown: true, // Show header for map screen to allow going back
          title: "Route Map",
          headerBackTitle: "Back"
        }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;