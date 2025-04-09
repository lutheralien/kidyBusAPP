// src/screens/index.ts

// Auth screens
export { default as LoginScreen } from '../screens/auth/LoginScreen';
export { default as SignupScreen } from '../screens/auth/SignupScreen';
export { default as ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Common screens
export { default as SplashScreen } from './common/SplashScreen';
export { default as SettingsScreen } from './common/SettingsScreen';

// Admin screens
export { default as DriverDashboardScreen } from './driver/DriverDashboardScreen';

// User screens
export { default as ParentDashboardScreen } from './parent/ParentDashboardScreen';
export { default as ProfileScreen } from './user/ProfileScreen';