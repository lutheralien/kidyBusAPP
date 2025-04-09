// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}) => {
  // Determine button style based on variant and size
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};

    // Variant styling
    switch (variant) {
      case 'primary':
        buttonStyle = {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        };
        break;
      case 'secondary':
        buttonStyle = {
          backgroundColor: COLORS.secondary,
          borderWidth: 0,
        };
        break;
      case 'outline':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          backgroundColor: 'transparent',
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        };
        break;
      default:
        buttonStyle = {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        };
    }

    // Size styling
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          height: SIZES.buttonHeight - SIZES.s,
          paddingHorizontal: SIZES.m,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          height: SIZES.buttonHeight,
          paddingHorizontal: SIZES.l,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          height: SIZES.buttonHeight + SIZES.s,
          paddingHorizontal: SIZES.xl,
        };
        break;
    }

    // Disabled state
    if (disabled) {
      buttonStyle = {
        ...buttonStyle,
        opacity: 0.5,
      };
    }

    return buttonStyle;
  };

  // Determine text style based on variant and size
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {
      fontFamily: FONTS.medium,
      fontSize: FONTS.button,
      textAlign: 'center',
    };

    // Variant text styling
    switch (variant) {
      case 'primary':
      case 'secondary':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.white,
        };
        break;
      case 'outline':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.primary,
        };
        break;
      case 'text':
        textStyleObj = {
          ...textStyleObj,
          color: COLORS.primary,
        };
        break;
    }

    // Size text styling
    switch (size) {
      case 'small':
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.body2,
        };
        break;
      case 'medium':
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.button,
        };
        break;
      case 'large':
        textStyleObj = {
          ...textStyleObj,
          fontSize: FONTS.h4,
        };
        break;
    }

    return textStyleObj;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[styles.buttonText, getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.borderRadius,
    paddingVertical: SIZES.s,
    paddingHorizontal: SIZES.m,
    marginVertical: SIZES.xs,
  },
  buttonText: {
    marginHorizontal: SIZES.xs,
  },
});

export default Button;

