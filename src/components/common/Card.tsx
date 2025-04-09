
// src/components/common/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { COLORS, SIZES, SHADOWS, ELEVATIONS } from '../../constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'outlined';
  elevation?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  elevation = 'medium',
  style,
  children,
  ...props
}) => {
  // Get card style based on variant
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {};

    switch (variant) {
      case 'default':
        cardStyle = {
          backgroundColor: COLORS.card,
          ...getElevationStyle(),
        };
        break;
      case 'flat':
        cardStyle = {
          backgroundColor: COLORS.card,
          // No elevation or shadows
        };
        break;
      case 'outlined':
        cardStyle = {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.lightGray,
          // No elevation or shadows
        };
        break;
    }

    return cardStyle;
  };

  // Get elevation style based on level
  const getElevationStyle = (): ViewStyle => {
    switch (elevation) {
      case 'none':
        return {};
      case 'small':
        return {
          ...SHADOWS.small,
          ...ELEVATIONS.small,
        };
      case 'medium':
        return {
          ...SHADOWS.medium,
          ...ELEVATIONS.medium,
        };
      case 'large':
        return {
          ...SHADOWS.large,
          ...ELEVATIONS.large,
        };
      default:
        return {
          ...SHADOWS.medium,
          ...ELEVATIONS.medium,
        };
    }
  };

  return (
    <View style={[styles.card, getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.borderRadius,
    padding: SIZES.m,
    marginVertical: SIZES.s,
  },
});

export default Card;

