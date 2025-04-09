
// src/screens/auth/SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button, Input, Card } from '../../components/common';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { AuthNavigationProp } from '../../types/navigation.types';
import { useAuth } from '../../hooks/useAuth';
import { isValidName, isValidEmail, isValidPassword } from '@/src/utils/storage';

interface SignupScreenProps {
  navigation: AuthNavigationProp<typeof ROUTES.SIGNUP>;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // Get auth hook
  const { signup, status, error } = useAuth();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Name validation
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (!isValidName(name)) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters with letters and numbers';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle signup
  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const success = await signup(name, email, password);
    setLoading(false);

    if (!success) {
      // Show error message
      setErrors({
        email: 'This email may already be in use',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Sign up to get started</Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              isPassword={true}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              isPassword={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
            />
          </Card>

          <View style={styles.footerContainer}>
            <Text style={styles.hasAccountText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SIZES.l,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: SIZES.l,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.h1,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body1,
    color: COLORS.textSecondary,
  },
  formCard: {
    padding: SIZES.l,
  },
  signupButton: {
    marginTop: SIZES.l,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.xl,
  },
  hasAccountText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.textSecondary,
    marginRight: SIZES.xs,
  },
  loginText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.body2,
    color: COLORS.primary,
  },
});

export default SignupScreen;
