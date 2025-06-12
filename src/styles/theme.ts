// src/styles/theme.ts
import { Platform } from 'react-native';

export const COLORS = {
  primary: '#007AFF', // A modern blue
  secondary: '#FF3B30', // A vibrant red for accents or errors
  background: '#F2F2F7', // Light gray for backgrounds
  cardBackground: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)', // Semi-transparent white for cards
  text: '#000000', // Black for primary text
  subtleText: '#6E6E73', // Gray for secondary or less important text
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8A8A8E',
  lightGray: '#D1D1D6',
  // Add more colors as needed
};

export const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System-Bold' : 'Roboto-Bold',
  // Define more font weights and styles if you have custom fonts
  sizes: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
  },
};

export const BLUR_EFFECT = {
  tint: Platform.select({
    ios: 'light', // 'light', 'dark', 'default'
    android: 'light' // 'light', 'dark', 'default' (Note: Android blur might have different behavior/appearance)
  }),
  intensity: Platform.OS === 'ios' ? 80 : 100, // Intensity of the blur effect (0-100)
};

export const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
};

export const BORDER_RADIUS = {
  small: 5,
  medium: 10,
  large: 15,
};

const theme = {
  COLORS,
  FONTS,
  BLUR_EFFECT,
  SPACING,
  BORDER_RADIUS,
};

export default theme;
