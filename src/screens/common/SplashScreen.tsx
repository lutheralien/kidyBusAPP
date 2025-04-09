// src/screens/common/SplashScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { useAppDispatch } from "../../store/hooks";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { ROUTES } from "../../constants/routes";
import { reset } from "../../navigation/NavigationService";
import Storage from "../../utils/storage";
import { User } from "../../types/user.types";
import { setCredentials } from "../../store/slices/authSlice";

const { width } = Dimensions.get("window");

// Add a prop to determine whether the component should perform auth checks
interface SplashScreenProps {
  skipAuthCheck?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ skipAuthCheck = false }) => {
  const dispatch = useAppDispatch();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  // Animation and auth check
  useEffect(() => {
    const handleSplash = async () => {
      // Start animations with longer durations and added delays
      Animated.sequence([
        // Small initial delay before anything happens (creates anticipation)
        Animated.delay(300),
        
        // Fade in and scale logo with longer durations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500, // Increased from 1000ms
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smoother easing
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 15, // Reduced from 20 for slower spring
            friction: 8, // Increased from 7 for less bounce
            useNativeDriver: true,
          }),
        ]),
        
        // Brief pause between logo and loading indicator
        Animated.delay(500),
        
        // After logo appears, show loading with longer fade
        Animated.timing(loadingOpacity, {
          toValue: 1,
          duration: 1500, // Increased from 1000ms
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smoother easing
        }),
      ]).start();

      // Longer delay to show splash screen (total of animations + this delay)
      // The total time will be around 5.3 seconds now
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // If we're skipping auth check (being used purely as a loading screen),
      // we don't need to do anything else after animations
      if (skipAuthCheck) {
        return;
      }

      // Otherwise, perform authentication check and navigation
      try {
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

          // Navigate based on role
          if (role === "DRIVER") {
            reset(ROUTES.DRIVER);
          } else {
            reset(ROUTES.PARENT);
          }
        } else {
          // If no auth data, go to auth screens
          reset(ROUTES.AUTH);
        }
      } catch (error) {
        // On error, go to auth screens
        console.error("Auth check failed:", error);
        reset(ROUTES.AUTH);
      }
    };

    // Start the splash sequence
    handleSplash();
  }, [dispatch, fadeAnim, scaleAnim, loadingOpacity, skipAuthCheck]);

  return (
    <>
      {/* Set status bar to translucent and light content */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <View style={styles.circle} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logo}>
            <Text style={styles.logoText}>KB</Text>
          </View>

          <Text style={styles.tagline}>Your Journey Starts Here</Text>
        </Animated.View>

        <Animated.View
          style={[styles.loadingContainer, { opacity: loadingOpacity }]}
        >
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </Animated.View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    // Extend content under the status bar
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -width * 0.75,
    left: -width * 0.25,
  },
  circle2: {
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    top: -width * 0.5,
    right: -width * 0.5,
    left: "auto",
  },
  circle3: {
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    bottom: -width * 0.3,
    right: -width * 0.3,
    top: "auto",
    left: "auto",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.m,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SIZES.xl,
  },
  logoText: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.white,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.lineHeightBody1,
    color: COLORS.white,
    marginTop: SIZES.m,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: SIZES.xl,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.white,
    marginTop: SIZES.m,
    opacity: 0.9,
  },
  versionText: {
    position: "absolute",
    bottom: SIZES.xl + (Platform.OS === 'ios' ? 20 : 0),
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default SplashScreen;