  // src/navigation/AuthNavigator.tsx
  import React from 'react';
  import { createStackNavigator } from '@react-navigation/stack';
  import { ROUTES } from '../constants/routes';
  import { AuthStackParamList } from '../types/navigation.types';
  
  // Import screens
import { ForgotPasswordScreen, LoginScreen, SignupScreen } from '../screens';
import PasswordResetScreen from '../screens/auth/PasswordResetScreen';
  
  const Stack = createStackNavigator<AuthStackParamList>();
  
  const AuthNavigator: React.FC = () => {
    return (
      <Stack.Navigator
        initialRouteName={ROUTES.LOGIN}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
        <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
        <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
        <Stack.Screen name={ROUTES.OTP} component={PasswordResetScreen} />
      </Stack.Navigator>
    );
  };
  
  export default AuthNavigator;