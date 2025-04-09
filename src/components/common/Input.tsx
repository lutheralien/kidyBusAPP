// src/components/common/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  ...props
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);

  // Toggle password visibility
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          props.editable === false ? styles.inputDisabled : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon || isPassword ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {(rightIcon || isPassword) && (
          <View style={styles.rightIcon}>
            {isPassword ? (
              <TouchableOpacity onPress={toggleSecureEntry}>
                <Text style={styles.passwordToggle}>
                  {secureTextEntry ? 'Show' : 'Hide'}
                </Text>
              </TouchableOpacity>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>
      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.m,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.body2,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.white,
    height: SIZES.inputHeight,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.regular,
    fontSize: FONTS.body1,
    color: COLORS.text,
    paddingHorizontal: SIZES.m,
  },
  inputWithLeftIcon: {
    paddingLeft: SIZES.xs,
  },
  inputWithRightIcon: {
    paddingRight: SIZES.xs,
  },
  leftIcon: {
    paddingLeft: SIZES.m,
  },
  rightIcon: {
    paddingRight: SIZES.m,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.extraLightGray,
    opacity: 0.7,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.caption,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  passwordToggle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.caption,
    color: COLORS.primary,
  },
});

export default Input;
