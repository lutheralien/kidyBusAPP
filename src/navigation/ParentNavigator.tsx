 // src/navigation/UserNavigator.tsx
 import React from 'react';
 import { createStackNavigator } from '@react-navigation/stack';
 import { ROUTES } from '../constants/routes';
 import { UserStackParamList } from '../types/navigation.types';
import { ParentDashboardScreen, ProfileScreen, SettingsScreen } from '../screens';
 
 
 const Stack = createStackNavigator<UserStackParamList>();
 
 const ParentNavigator: React.FC = () => {
   return (
     <Stack.Navigator
       initialRouteName={ROUTES.PARENT_DASHBOARD}
       screenOptions={{
         headerShown: false,
       }}
     >
       <Stack.Screen 
         name={ROUTES.PARENT_DASHBOARD} 
         component={ParentDashboardScreen}
         options={{ title: 'Parent Dashboard' }}
       />
       <Stack.Screen 
         name={ROUTES.PROFILE} 
         component={ProfileScreen}
         options={{ title: 'My Profile' }}
       />
       <Stack.Screen 
         name={ROUTES.SETTINGS} 
         component={SettingsScreen}
         options={{ title: 'Settings' }}
       />
     </Stack.Navigator>
   );
 };
 
 export default ParentNavigator;