// App.tsx
import React from 'react';
import { StatusBar, LogBox, SafeAreaView, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { AppNavigator } from './src/navigation';
import Toast from 'react-native-toast-message';
import { COLORS } from './src/constants/theme';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'AsyncStorage has been extracted from react-native',
]);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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