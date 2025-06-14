// src/styles/theme.ts
import { Platform } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

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
  FONTS: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System-Bold' : 'Roboto-Bold', // Note: React Native Paper uses font weights (e.g., 400, 700) with configureFonts.
                                                              // We'll map these to default variants.
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
  accent: '#FF3B30', // Added for mapping to Paper's secondary/accent
};

export const darkColors = {
  primary: '#0A84FF',
  secondary: '#FF453A',
  background: '#000000',
  cardBackground: Platform.OS === 'ios' ? 'rgba(26, 26, 26, 0.85)' : 'rgba(26, 26, 26, 0.9)',
  text: '#FFFFFF',
  subtleText: '#8D8D93',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8D8D93',
  lightGray: '#3A3A3C',
  inputBackground: '#1C1C1E',
  borderColor: '#3A3A3C',
  accent: '#FF453A', // Added for mapping to Paper's secondary/accent
};

// Font configuration for React Native Paper
// We'll use the existing font family names for the default variants.
// Note: React Native Paper's `configureFonts` is more about font variants (regular, medium, light, thin)
// and their respective font family, weight, and style.
// For simplicity, we'll create a basic config. If you have specific font files for different weights,
// you would specify them in a more detailed font config object passed to configureFonts.
const fontConfig = {
  customVariant: {
    fontFamily: commonStyles.FONTS.regular,
    fontWeight: 'normal',
  },
  // Map existing bold to a Paper variant if needed, or rely on applying fontWeight directly in components.
  // For now, Paper components will use their default font resolution.
  // If specific bold versions of fonts are used globally, configure them here.
};


export const PaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    secondary: lightColors.accent, // MD3 uses 'secondary'
    background: lightColors.background,
    surface: lightColors.cardBackground, // Mapping cardBackground to surface
    onSurface: lightColors.text,
    onSurfaceVariant: lightColors.subtleText,
    outline: lightColors.borderColor,
    surfaceVariant: lightColors.inputBackground, // For input backgrounds
    // Keep custom colors from the original theme
    customWhite: lightColors.white,
    customBlack: lightColors.black,
    customGray: lightColors.gray,
    customLightGray: lightColors.lightGray,
    // Carry over other specific colors if they don't map directly
    // For example, if `secondary` from original theme was used for something other than Paper's `secondary`
    originalSecondary: lightColors.secondary, // if needed for specific components not using Paper's theme structure
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}), // Example if using custom font variants globally
  // Keeping custom non-Paper theme properties for now, namespaced if possible or at root
  SPACING: commonStyles.SPACING,
  BORDER_RADIUS: commonStyles.BORDER_RADIUS,
  BLUR_EFFECT: {
    tint: 'light' as 'light' | 'dark' | 'default',
    intensity: Platform.OS === 'ios' ? 80 : 100,
  },
  MODE: 'light',
  FONTS: commonStyles.FONTS, // Keep original fonts for direct access if needed
};

export const PaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.accent, // MD3 uses 'secondary'
    background: darkColors.background,
    surface: darkColors.cardBackground,
    onSurface: darkColors.text,
    onSurfaceVariant: darkColors.subtleText,
    outline: darkColors.borderColor,
    surfaceVariant: darkColors.inputBackground,
    customWhite: darkColors.white,
    customBlack: darkColors.black,
    customGray: darkColors.gray,
    customLightGray: darkColors.lightGray,
    originalSecondary: darkColors.secondary,
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}),
  SPACING: commonStyles.SPACING,
  BORDER_RADIUS: commonStyles.BORDER_RADIUS,
  BLUR_EFFECT: {
    tint: 'dark' as 'light' | 'dark' | 'default',
    intensity: Platform.OS === 'ios' ? 80 : 100,
  },
  MODE: 'dark',
  FONTS: commonStyles.FONTS,
};

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? PaperLightTheme : PaperDarkTheme;
};

// Export the new theme types
export type PaperThemeType = typeof PaperLightTheme;
