  // src/navigation/AdminNavigator.tsx
  import React from 'react';
  import { createStackNavigator } from '@react-navigation/stack';
  
  import { AdminStackParamList } from '../types/navigation.types';
  
  // Import screens
  import AdminDashboardScreen from '../screens/driver/AdminDashboardScreen';
  
import { ROUTES } from '../constants/routes';
import { SettingsScreen } from '../screens';
  
  const Stack = createStackNavigator<AdminStackParamList>();
  
  const DriverNavigator: React.FC = () => {
    return (
      <Stack.Navigator
        initialRouteName={ROUTES.ADMIN_DASHBOARD}
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen 
          name={ROUTES.ADMIN_DASHBOARD} 
          component={AdminDashboardScreen}
          options={{ title: 'Admin Dashboard' }}
        />
        <Stack.Screen 
          name={ROUTES.SETTINGS} 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    );
  };
  
  export default DriverNavigator;