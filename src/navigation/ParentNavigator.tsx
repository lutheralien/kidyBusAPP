import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../constants/routes';
import { ParentStackParamList, ParentTabParamList } from '../types/navigation.types';
import { ParentDashboardScreen, ProfileScreen, SettingsScreen, TodaysTripsScreen } from '../screens';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';


// Create both Stack and Tab navigators
const Stack = createStackNavigator<ParentStackParamList>();
const Tab = createBottomTabNavigator<ParentTabParamList>();

// Tab Navigator Component
const ParentTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<ParentTabParamList, keyof ParentTabParamList> }) => ({
        headerShown: false, // Hide header from tab screens
        tabBarIcon: ({ focused, color, size }: { 
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let iconName: string = 'help-circle'; // Default icon

          if (route.name === ROUTES.PARENT_DASHBOARD) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.TODAYS_TRIPS) {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === ROUTES.SETTINGS) {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          // You can return any component here
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name={ROUTES.PARENT_DASHBOARD} 
        component={ParentDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name={ROUTES.TODAYS_TRIPS} 
        component={TodaysTripsScreen}
        options={{ title: 'Today\'s Trips' }}
      />
      <Tab.Screen 
        name={ROUTES.PROFILE} 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen 
        name={ROUTES.SETTINGS} 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Parent Navigator is now a simple wrapper over the tab navigator
const ParentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name={ROUTES.PARENT_TAB} 
        component={ParentTabNavigator} 
      />
    </Stack.Navigator>
  );
};

export default ParentNavigator;