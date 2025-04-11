// src/screens/index.ts

// Auth screens
export { default as LoginScreen } from '../screens/auth/LoginScreen';
export { default as SignupScreen } from '../screens/auth/SignupScreen';
export { default as ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Common screens
export { default as SplashScreen } from './common/SplashScreen';
export { default as SettingsScreen } from './common/SettingsScreen';
export { default as ProfileScreen } from './common/ProfileScreen';

// Driver screens
export { default as DriverDashboardScreen } from './driver/DriverDashboardScreen';
export { default as DriversTodaysTripsScreen } from './driver/DriversTodaysTripsScreen';
export { default as DriverMapScreen } from './driver/DriverMapScreen';


// Parent screens
export { default as ParentDashboardScreen } from './parent/ParentDashboardScreen';
export { default as TodaysTripsScreen } from './parent/TodaysTripsScreen';