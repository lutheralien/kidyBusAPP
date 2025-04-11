import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ROUTES } from '../constants/routes';

// Auth stack parameter list
export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.SIGNUP]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
};

// Driver stack parameter list
export type DriverStackParamList = {
  [ROUTES.DRIVER_TAB]: undefined;
  [ROUTES.DRIVER_DASHBOARD]: undefined;
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.DRIVER_MAP]: { tripId: string };
};

// Parent stack parameter list
export type ParentStackParamList = {
  [ROUTES.PARENT_TAB]: undefined;
  [ROUTES.PARENT_DASHBOARD]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

// App stack parameter list (combines all stacks)
export type AppStackParamList = {
  [ROUTES.SPLASH]: undefined;
  [ROUTES.AUTH]: undefined;
  [ROUTES.DRIVER]: undefined;
  [ROUTES.PARENT]: undefined;
};

// Navigation prop types
export type AuthNavigationProp<T extends keyof AuthStackParamList> = StackNavigationProp<
  AuthStackParamList,
  T
>;

export type DriverNavigationProp<T extends keyof DriverStackParamList> = StackNavigationProp<
  DriverStackParamList,
  T
>;

export type ParentNavigationProp<T extends keyof ParentStackParamList> = StackNavigationProp<
  ParentStackParamList,
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

export type DriverRouteProp<T extends keyof DriverStackParamList> = RouteProp<
  DriverStackParamList,
  T
>;

export type ParentRouteProp<T extends keyof ParentStackParamList> = RouteProp<
  ParentStackParamList,
  T
>;

export type AppRouteProp<T extends keyof AppStackParamList> = RouteProp<
  AppStackParamList,
  T
>;

// Parent tab parameter list
export type ParentTabParamList = {
  [ROUTES.PARENT_DASHBOARD]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

// Navigation prop type for bottom tabs
export type ParentTabNavigationProp<T extends keyof ParentTabParamList> = BottomTabNavigationProp<
  ParentTabParamList,
  T
>;

// Route prop type for bottom tabs
export type ParentTabRouteProp<T extends keyof ParentTabParamList> = RouteProp<
  ParentTabParamList,
  T
>;