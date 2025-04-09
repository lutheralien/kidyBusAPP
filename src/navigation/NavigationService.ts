
  // src/navigation/NavigationService.ts
  import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
  import { AppStackParamList } from '../types/navigation.types';
  
  // Create a navigation reference that can be used outside of components
  export const navigationRef = createNavigationContainerRef<AppStackParamList>();
  
  // Navigate to a screen
  export function navigate<RouteName extends keyof AppStackParamList>(
    name: RouteName,
    params?: AppStackParamList[RouteName]
  ) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  }
  
  // Replace the current screen
  export function replace<RouteName extends keyof AppStackParamList>(
    name: RouteName,
    params?: AppStackParamList[RouteName]
  ) {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(name, params));
    }
  }
  
  // Go back to the previous screen
  export function goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }
  
  // Reset the navigation state
  export function reset(routeName: string) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName as any }],
      });
    }
  }