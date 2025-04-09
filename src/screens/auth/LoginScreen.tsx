// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { ROUTES } from "@/src/constants/routes";
import {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  ELEVATIONS,
} from "@/src/constants/theme";
import { AuthNavigationProp } from "@/src/types/navigation.types";
import { Card, Input } from "../../components/common";
import { isValidPassword, isValidPhoneNumber } from "@/src/utils/storage";
import useAuth from "@/src/hooks/useAuth";

interface LoginScreenProps {
  navigation: AuthNavigationProp<typeof ROUTES.LOGIN>;
}

// Define the user types
type UserType = "PARENT" | "DRIVER";

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // State for form fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>("PARENT"); // Default to PARENT

  // Get auth hook
  const { login, status, error } = useAuth();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { phone?: string; password?: string } = {};

    // Phone validation
    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters with letters and numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
    const result = await login(phone, password, userType);
    setLoading(false);
    if (!result.success) {
      // Handle specific error messages
      if (result.message === "Password reset required") {
        // Show toast to inform user they need to reset password
        Toast.show({
          type: "info",
          text1: "Password Reset Required",
          text2: "You need to reset your password to continue.",
          visibilityTime: 3000,
        });
        
        // Navigate to reset password screen after toast is shown
        setTimeout(() => {
          navigation.navigate(ROUTES.FORGOT_PASSWORD, { phone, userType });
        }, 1000);
        return;
      }
  
      // Handle other error messages with toast
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: result.message || "Authentication failed. Please try again.",
        visibilityTime: 4000,
      });
    } else {
      // Show success toast when login is successful
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back!",
      });
      
      // You can add navigation logic here to redirect user to app's main screen
    }
  };

  // Toggle user type
  const toggleUserType = (type: UserType) => {
    setUserType(type);
    // Clear any existing errors when switching types
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Brand Icon Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              {/* Replace with your app logo */}
              <Text style={styles.logoText}>KB</Text>
            </View>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>Sign in to continue</Text>
          </View>

          {/* User Type Selector */}
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === "PARENT" && styles.userTypeButtonActive,
              ]}
              onPress={() => toggleUserType("PARENT")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people"
                size={20}
                color={userType === "PARENT" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.userTypeText,
                  userType === "PARENT" && styles.userTypeTextActive,
                ]}
              >
                Parent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === "DRIVER" && styles.userTypeButtonActive,
              ]}
              onPress={() => toggleUserType("DRIVER")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="car"
                size={20}
                color={userType === "DRIVER" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.userTypeText,
                  userType === "DRIVER" && styles.userTypeTextActive,
                ]}
              >
                Driver
              </Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Phone Number"
              placeholder="Enter your 10-digit phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              leftIcon={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={COLORS.textPlaceholder}
                />
              }
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              isPassword={true}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.textPlaceholder}
                />
              }
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Login as {userType === "PARENT" ? "Parent" : "Driver"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(ROUTES.SIGNUP)}
            >
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SIZES.l,
    paddingTop: height * 0.05,
    paddingBottom: SIZES.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SIZES.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    ...Platform.select({
      android: ELEVATIONS.medium,
    }),
  },
  logoText: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.primary,
  },
  headerContainer: {
    marginBottom: SIZES.m,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h1,
    color: COLORS.white,
    marginBottom: SIZES.xs,
    textAlign: "center",
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body1,
    color: COLORS.white,
    textAlign: "center",
    opacity: 0.8,
  },
  // User Type Selector Styles
  userTypeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SIZES.l,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 4,
    ...SHADOWS.small,
    ...Platform.select({
      android: ELEVATIONS.small,
    }),
  },
  userTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: SIZES.borderRadius - 4,
    marginHorizontal: 2,
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  userTypeText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
    marginLeft: 8,
  },
  userTypeTextActive: {
    color: COLORS.white,
  },
  formCard: {
    padding: SIZES.l,
    borderRadius: 16,
    ...SHADOWS.medium,
    ...Platform.select({
      android: ELEVATIONS.medium,
    }),
  },
  loginButton: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.l,
    ...SHADOWS.small,
    ...Platform.select({
      android: ELEVATIONS.small,
    }),
  },
  loginButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: FONTS.button,
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: SIZES.m,
  },
  forgotPasswordText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.xl,
  },
  noAccountText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.white,
    marginRight: SIZES.xs,
  },
  signupText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.white,
    fontWeight: "bold",
  },
});

export default LoginScreen;
