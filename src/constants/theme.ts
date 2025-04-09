// src/constants/theme.ts
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Color palette
export const COLORS = {
  // Primary colors
  primary: '#4A90E2',
  primaryDark: '#3A7BD5',
  primaryLight: '#6FA5E9',
  
  // Secondary colors
  secondary: '#5E5CE6',
  secondaryDark: '#4A49CB',
  secondaryLight: '#7875F5',
  
  // Accent colors
  accent: '#FF9500',
  accentDark: '#D97B00',
  accentLight: '#FFB040',
  
  // Functional colors
  success: '#34C759',
  warning: '#FFCC00',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Neutral colors
  black: '#000000',
  darkGray: '#1A1A1A',
  gray: '#8E8E93',
  lightGray: '#D1D1D6',
  extraLightGray: '#F2F2F7',
  white: '#FFFFFF',
  
  // Background colors
  background: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text colors
  text: '#000000',
  textSecondary: '#8E8E93',
  textPlaceholder: '#C7C7CC',
  
  // Transparent colors
  transparent: 'transparent',
  semiTransparent: 'rgba(0, 0, 0, 0.3)',
};

// Typography
export const FONTS = {
  // Font families
  regular: 'System',
  medium: 'System',
  bold: 'System',
  
  // Font sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  body1: 16,
  body2: 14,
  caption: 12,
  button: 16,
  
  // Line heights
  lineHeightH1: 40,
  lineHeightH2: 32,
  lineHeightH3: 28,
  lineHeightH4: 24,
  lineHeightH5: 22,
  lineHeightH6: 20,
  lineHeightBody1: 24,
  lineHeightBody2: 22,
  lineHeightCaption: 16,
  lineHeightButton: 24,
};

// Spacing
export const SIZES = {
  // Global screen dimensions
  width,
  height,
  
  // Spacing scale
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  
  // Common component sizes
  borderRadius: 8,
  buttonHeight: 48,
  inputHeight: 48,
  iconSize: 24,
  
  // Padding and margin
  paddingHorizontal: 16,
  paddingVertical: 16,
  marginHorizontal: 16,
  marginVertical: 16,
  
  // Screen specific
  headerHeight: 60,
  tabBarHeight: 60,
};

// Shadows (iOS)
export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 9,
  },
};

// Elevations (Android)
export const ELEVATIONS = {
  small: {
    elevation: 3,
  },
  medium: {
    elevation: 6,
  },
  large: {
    elevation: 9,
  },
};

// Export theme as a comprehensive object
export const THEME = {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  ELEVATIONS,
};

export default THEME;