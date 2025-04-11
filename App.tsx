// App.tsx
import './polyfills';
import React, { useEffect } from 'react';
import { StatusBar, LogBox, SafeAreaView, StyleSheet, View } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState, AppDispatch } from './src/store/store';
import { AppNavigator } from './src/navigation';
import Toast from 'react-native-toast-message';
import { COLORS } from './src/constants/theme';
import Geocoder from 'react-native-geocoding';
import { fetchMapsKey, fetchMapRadius } from './src/store/slices/configSlice';

// Create a typed version of useDispatch
const useAppDispatch = () => useDispatch<AppDispatch>();

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'AsyncStorage has been extracted from react-native',
]);

// Create a separate component to use hooks after PersistGate
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch(); // Use the typed version
  const mapsKey = useSelector((state: RootState) => state.config.mapsKey);

  // Initialize maps key
  useEffect(() => {
    dispatch(fetchMapsKey());
  }, [dispatch]);

  // Initialize maps radius
  useEffect(() => {
    dispatch(fetchMapRadius());
  }, [dispatch]);

  // Initialize Geocoder when mapsKey is available
  useEffect(() => {
    if (mapsKey) {
      Geocoder.init(mapsKey, {
        region: 'gh', // Set Ghana as default region
      });
    }
  }, [mapsKey]);

  return (
    <>
      {/* The outer SafeAreaView controls the status bar background */}
      <SafeAreaView style={styles.outerSafeArea}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        
        {/* The inner SafeAreaView contains the main app content */}
        <SafeAreaView style={styles.innerSafeArea}>
          <View style={styles.container}>
            <AppNavigator />
          </View>
          <Toast />
        </SafeAreaView>
      </SafeAreaView>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  outerSafeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Color for top notch area
  },
  innerSafeArea: {
    flex: 1,
    backgroundColor: COLORS.extraLightGray, // The improved grey background
  },
  container: {
    flex: 1,
    // We can add additional global styling here if needed
    // For example: padding, background patterns, etc.
  },
});

export default App;