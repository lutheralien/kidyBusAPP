// In AppNavigator.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../constants/routes';
import { AppStackParamList } from '../types/navigation.types';
import { navigationRef } from './NavigationService';
import { RootState } from '../store/store';
import { setCredentials } from '../store/slices/authSlice';
import Storage from '../utils/storage';
import { User } from '../types/user.types';

import AuthNavigator from './AuthNavigator';
import DriverNavigator from './DriverNavigator';
import ParentNavigator from './ParentNavigator';
import SplashScreen from '../screens/common/SplashScreen';

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, role, status } = useSelector((state: RootState) => state.auth);
  
  // Track app initialization state
  const [initializing, setInitializing] = useState(true);
  const [isComingFromLogout, setIsComingFromLogout] = useState(false);
  
  // Check authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Record the start time of the initialization process
        const startTime = Date.now();
        
        // Check for stored auth data
        const userData = await Storage.getItem<User>("user");
        const token = await Storage.getItem<string>("token");
        const role = await Storage.getItem<string>("role");

        if (userData && token && role) {
          // If we have the required data, restore authentication state
          dispatch(
            setCredentials({
              user: userData,
              token,
              role,
            })
          );
        }
        
        // Calculate how long the auth check took
        const authCheckDuration = Date.now() - startTime;

        // Define minimum splash screen duration (in milliseconds)
        // This should match or exceed the total animation time in SplashScreen
        const MIN_SPLASH_DURATION = 3000; // 3 seconds to ensure animations complete
        
        // If auth check was quick, delay the completion to ensure minimum splash screen time
        if (authCheckDuration < MIN_SPLASH_DURATION) {
          await new Promise(resolve => 
            setTimeout(resolve, MIN_SPLASH_DURATION - authCheckDuration)
          );
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        // Mark initialization as complete
        setInitializing(false);
      }
    };

    checkAuth();
  }, [dispatch]);
  
  // Detect logout
  useEffect(() => {
    if (!isAuthenticated && status === 'idle' && !initializing) {
      setIsComingFromLogout(true);
    }
  }, [isAuthenticated, status, initializing]);
  
  // If still initializing, show the splash screen component
  if (initializing) {
    return <SplashScreen skipAuthCheck={true} />;
  }
  
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name={ROUTES.AUTH} component={AuthNavigator} />
        ) : (
          // Authenticated, show role-based flow
          role === 'DRIVER' ? (
            <Stack.Screen name={ROUTES.DRIVER} component={DriverNavigator} />
          ) : (
            <Stack.Screen name={ROUTES.PARENT} component={ParentNavigator} />
          )
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;