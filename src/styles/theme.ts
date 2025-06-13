// src/styles/theme.ts
import { Platform } from 'react-native';

export const commonStyles = {
  SPACING: {
    small: 8,
    medium: 16,
    large: 24,
  },
  BORDER_RADIUS: {
    small: 5,
    medium: 10,
    large: 15,
  },
  FONTS: { // Assuming fonts are consistent across themes
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System-Bold' : 'Roboto-Bold',
    sizes: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24,
    },
  },
};

export const lightColors = {
  primary: '#007AFF',
  secondary: '#FF3B30',
  background: '#F2F2F7',
  cardBackground: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
  text: '#000000',
  subtleText: '#6E6E73',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8A8A8E',
  lightGray: '#D1D1D6',
  // Specific light theme colors
  inputBackground: '#FFFFFF',
  borderColor: '#D1D1D6',
};

export const darkColors = {
  primary: '#0A84FF', // A slightly brighter blue for dark mode
  secondary: '#FF453A', // A slightly brighter red
  background: '#000000', // Pure black for background
  cardBackground: Platform.OS === 'ios' ? 'rgba(26, 26, 26, 0.85)' : 'rgba(26, 26, 26, 0.9)', // Dark, semi-transparent
  text: '#FFFFFF',
  subtleText: '#8D8D93', // Lighter gray for dark mode
  white: '#FFFFFF', // White remains white
  black: '#000000', // Black remains black
  gray: '#8D8D93', // Adjusted gray
  lightGray: '#3A3A3C', // Darker version of lightGray
  // Specific dark theme colors
  inputBackground: '#1C1C1E',
  borderColor: '#3A3A3C',
};

// BLUR_EFFECT can be part of a function that returns the full theme object based on mode
// Or defined with mode-specific tints directly if consumed that way
export const getTheme = (mode: 'light' | 'dark') => {
  const currentColors = mode === 'light' ? lightColors : darkColors;
  return {
    COLORS: currentColors,
    FONTS: commonStyles.FONTS,
    SPACING: commonStyles.SPACING,
    BORDER_RADIUS: commonStyles.BORDER_RADIUS,
    BLUR_EFFECT: {
      tint: mode === 'light' ? (Platform.OS === 'ios' ? 'light' : 'light') : (Platform.OS === 'ios' ? 'dark' : 'dark'),
      intensity: Platform.OS === 'ios' ? 80 : 100, // Intensity might also be theme-dependent if desired
    },
    MODE: mode, // Add current mode to the theme object
  };
};

// For now, we might not have a default export or it could be one of the modes
// The ThemeProvider will be responsible for providing the correct theme object.
// export default getTheme('light'); // Or handle this in the ThemeProvider
