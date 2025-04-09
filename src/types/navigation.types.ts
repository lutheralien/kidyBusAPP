
// src/types/navigation.types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';


// Auth stack parameter list
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Admin stack parameter list
export type AdminStackParamList = {
  AdminDashboard: undefined;
  ManageUsers: undefined;
  UserDetails: { userId: string };
  Settings: undefined;
};

// User stack parameter list
export type UserStackParamList = {
  UserDashboard: undefined;
  Profile: undefined;
  Settings: undefined;
};

// App stack parameter list (combines all stacks)
export type AppStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Admin: undefined;
  User: undefined;
};

// Navigation prop types
export type AuthNavigationProp<T extends keyof AuthStackParamList> = StackNavigationProp<
  AuthStackParamList,
  T
>;

export type AdminNavigationProp<T extends keyof AdminStackParamList> = StackNavigationProp<
  AdminStackParamList,
  T
>;

export type UserNavigationProp<T extends keyof UserStackParamList> = StackNavigationProp<
  UserStackParamList,
  T
>;

export type AppNavigationProp<T extends keyof AppStackParamList> = StackNavigationProp<
  AppStackParamList,
  T
>;

// Route prop types
export type AuthRouteProp<T extends keyof AuthStackParamList> = RouteProp<
  AuthStackParamList,
  T
>;

export type AdminRouteProp<T extends keyof AdminStackParamList> = RouteProp<
  AdminStackParamList,
  T
>;

export type UserRouteProp<T extends keyof UserStackParamList> = RouteProp<
  UserStackParamList,
  T
>;

export type AppRouteProp<T extends keyof AppStackParamList> = RouteProp<
  AppStackParamList,
  T
>;