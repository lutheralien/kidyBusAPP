// src/screens/index.ts

// Auth screens
export { default as LoginScreen } from '../screens/auth/LoginScreen';
export { default as SignupScreen } from '../screens/auth/SignupScreen';
export { default as ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Common screens
export { default as SplashScreen } from './common/SplashScreen';
export { default as SettingsScreen } from './common/SettingsScreen';

// Admin screens
export { default as AdminDashboardScreen } from './driver/AdminDashboardScreen';

// User screens
export { default as UserDashboardScreen } from './parent/UserDashboardScreen';
export { default as ProfileScreen } from './user/ProfileScreen';