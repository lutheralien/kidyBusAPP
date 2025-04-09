import React, { useState, useRef, useEffect } from "react";
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
  TextInput,
  Alert,
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
import { isValidPassword } from "@/src/utils/storage";
import { sendOTP, verifyOTP, resetPassword } from "../../api/api.service";

// Default wait time for OTP resend in seconds
const defaultWaitTime = 60;

interface PasswordResetScreenProps {
  navigation: AuthNavigationProp<typeof ROUTES.OTP>;
  route: {
    params: {
      phone: string;
      userType: "DRIVER" | "PARENT";
    };
  };
}

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
}

// OTP Input Component
const OtpInput: React.FC<OtpInputProps> = ({ length, value, onChange }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Initialize array of refs
  useEffect(() => {
    inputRefs.current = Array(length).fill(null);
  }, [length]);

  const handleChange = (text: string, index: number) => {
    // Update the overall OTP value
    const newValue = value.split("");
    newValue[index] = text;
    onChange(newValue.join(""));

    // Move to next input if this one is filled
    if (text.length > 0 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            value={value[index] || ""}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            selectionColor={COLORS.primary}
          />
        ))}
    </View>
  );
};

const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({
  navigation,
  route,
}) => {
  const { phone } = route.params;

  // State variables
  const [step, setStep] = useState<"otp" | "reset">("otp");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    otp?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [waitTime, setWaitTime] = useState<number>(defaultWaitTime);
  const [resendingOtp, setResendingOtp] = useState(false);

  // Handle timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (waitTime > 0) {
      timer = setInterval(() => {
        setWaitTime((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [waitTime]);

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (waitTime > 0) return;

    setResendingOtp(true);
    try {
      const result = await sendOTP(phone);

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: "A new verification code has been sent to your phone.",
        });
        setWaitTime(defaultWaitTime);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Send OTP",
          text2: result.message || "Please try again",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setResendingOtp(false);
    }
  };

  // Validate OTP form
  const validateOtpForm = (): boolean => {
    const newErrors: { otp?: string } = {};

    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (otp.length !== 5) {
      newErrors.otp = "Please enter all 5 digits of the OTP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password reset form
  const validateResetForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters with letters and numbers";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    if (!validateOtpForm()) return;

    setLoading(true);
    try {
      const result = await verifyOTP(otp);

      if (result.success) {
        // Show success toast
        Toast.show({
          type: "success",
          text1: "Verification Successful",
          text2: "Processing your request...",
        });

        // Add a 3-second delay before moving to the reset password step
        setTimeout(() => {
          setStep("reset");
          setErrors({});
        }, 3000);
      } else {
        // Show error toast instead of setting error state
        Toast.show({
          type: "error",
          text1: "Verification Failed",
          text2: result.message || "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!validateResetForm()) return;

    setLoading(true);
    try {
      const result = await resetPassword(
        phone,
        password,
        route?.params?.userType
      );

      if (result.success) {
        // Show success message
        Toast.show({
          type: "success",
          text1: "Password Reset Successful",
          text2: "You can now login with your new password.",
        });

        // Navigate to login screen
        setTimeout(() => {
          navigation.navigate(ROUTES.LOGIN, {
            phone,
            userType: route?.params?.userType,
          });
        }, 3000);
      } else {
        Toast.show({
          type: "error",
          text1: "Reset Failed",
          text2:
            result.message || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
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
            <Text style={styles.headerTitle}>
              {step === "otp" ? "Verify OTP" : "Reset Password"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === "otp"
                ? `Enter the verification code sent to ${phone}`
                : "Create a new secure password for your account"}
            </Text>
          </View>

          <Card style={styles.formCard}>
            {step === "otp" ? (
              // OTP Verification Form
              <>
                <Text style={styles.formTitle}>Enter Verification Code</Text>

                <OtpInput length={5} value={otp} onChange={setOtp} />

                {errors.otp && (
                  <Text style={styles.errorText}>{errors.otp}</Text>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonText}>
                        Verify & Continue
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={COLORS.white}
                      />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>
                    Didn't receive the code?{" "}
                  </Text>
                  {waitTime > 0 ? (
                    <Text style={styles.timerText}>Resend in {waitTime}s</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={resendingOtp}
                    >
                      {resendingOtp ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                      ) : (
                        <Text style={styles.resendActionText}>Resend Code</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              // Password Reset Form
              <>
                <Text style={styles.formTitle}>Create New Password</Text>

                <Input
                  label="New Password"
                  placeholder="Enter your new password"
                  secureTextEntry={hidePassword}
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
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setHidePassword(!hidePassword)}
                    >
                      <Ionicons
                        name={hidePassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={COLORS.textPlaceholder}
                      />
                    </TouchableOpacity>
                  }
                  containerStyle={{ marginBottom: SIZES.m }}
                  helperText="Password must be at least 8 characters with letters and numbers"
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  secureTextEntry={hideConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={errors.confirmPassword}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.textPlaceholder}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() =>
                        setHideConfirmPassword(!hideConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          hideConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color={COLORS.textPlaceholder}
                      />
                    </TouchableOpacity>
                  }
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    fontFamily: FONTS.bold,
    fontSize: FONTS.h3,
    color: COLORS.text,
    marginBottom: SIZES.m,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.l,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius,
    fontSize: 24,
    fontFamily: FONTS.medium,
    textAlign: "center",
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    marginTop: -SIZES.s,
    marginBottom: SIZES.s,
  },
  actionButton: {
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
  actionButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: FONTS.button,
    marginRight: SIZES.xs,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.l,
  },
  resendText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
  timerText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
  },
  resendActionText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
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

export default PasswordResetScreen;
