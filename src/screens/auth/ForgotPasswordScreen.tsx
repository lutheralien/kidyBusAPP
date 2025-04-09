import React, { useState, useEffect } from "react";
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
import { isValidPhoneNumber } from "@/src/utils/storage";
import { sendOTP as sms } from "../../api/api.service";

interface ForgotPasswordProps {
  navigation: AuthNavigationProp<typeof ROUTES.FORGOT_PASSWORD>;
  route?: {
    params?: {
      phone?: string;
      userType?: "DRIVER" | "PARENT";
    };
  };
}

const ForgotPasswordScreen: React.FC<ForgotPasswordProps> = ({
  navigation,
  route,
}) => {
  // State for form fields
  const [phone, setPhone] = useState(route?.params?.phone || "");
  const [userType, setUserType] = useState(route?.params?.userType || "");
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [loading, setLoading] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { phone?: string } = {};

    // Phone validation
    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle send OTP
  const sendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Call the forgotPassword function from authApi.ts
      const response = await sms(phone);
      console.log("response for for", response);

      if (response.data?.success === true) {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: "Please check your phone for the verification code.",
        });
        // Navigation with 3-second delay
        setTimeout(() => {
          navigation.navigate(ROUTES.OTP, { phone, userType });
        }, 3000); // 3000 milliseconds = 3 seconds
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Send OTP",
          text2: response.data?.message || "Please try again",
        });
        setErrors({
          phone: response.data?.message || "Failed to send OTP",
        });
      }
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
      setErrors({
        phone: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Logo/Brand Icon Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              {/* Replace with your app logo */}
              <Text style={styles.logoText}>KB</Text>
            </View>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Account Recovery</Text>
            <Text style={styles.headerSubtitle}>
              Let's help you regain access to your account
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Verify Your Identity</Text>

            <Input
              label="Phone Number"
              placeholder="Enter your registered phone number"
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

            <TouchableOpacity
              style={styles.sendOtpButton}
              onPress={sendOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Text style={styles.sendOtpButtonText}>
                    Send Verification Code
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </Card>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.white} />
              <Text style={styles.backToLoginText}>
                Back to <Text style={styles.loginLink}>Sign In</Text>
              </Text>
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
  backButton: {
    position: "absolute",
    top: SIZES.m,
    left: SIZES.m,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SIZES.xl,
    marginTop: SIZES.xl,
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
    marginBottom: SIZES.l,
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
    maxWidth: "80%",
  },
  formCard: {
    padding: SIZES.l,
    borderRadius: 16,
    ...SHADOWS.medium,
    ...Platform.select({
      android: ELEVATIONS.medium,
    }),
  },
  formTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.m,
  },
  sendOtpButton: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.l,
    flexDirection: "row",
    ...SHADOWS.small,
    ...Platform.select({
      android: ELEVATIONS.small,
    }),
  },
  sendOtpButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: FONTS.button,
    marginRight: SIZES.xs,
  },
  footerContainer: {
    marginTop: SIZES.xl,
    alignItems: "center",
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backToLoginText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.white,
  },
  loginLink: {
    fontFamily: FONTS.medium,
    fontWeight: "bold",
  },
});

export default ForgotPasswordScreen;
