// src/styles/theme.ts
import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const commonStyles = {
  SPACING: {
    xxsmall: 2,
    xsmall: 4,
    small: 8,
    medium: 16,
    large: 24,
  },
  BORDER_RADIUS: {
    small: 5,
    medium: 10,
    large: 15,
  },
  ROUNDNESS: {
    small: 4,
    medium: 8,
    large: 12,
    button: 20, // Example for buttons
  },
  ELEVATION: { // Standard elevation values
    small: 2,
    medium: 5,
    large: 8,
  },
  FONTS: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'System-Bold' : 'Roboto-Bold', // Note: React Native Paper uses font weights (e.g., 400, 700) with configureFonts.
                                                              // We'll map these to default variants.
    sizes: {
      xxsmall: 8,
      xsmall: 10,
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
  textMuted: '#6E6E73', // Used for muted text in light mode
  subtleText: '#6E6E73',
  surfaceMuted: '#F2F2F7', // Used for muted surfaces in light mode
  surfaceSuccessMuted: '#F2F2F7', // For success muted surfaces
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8A8A8E',
  lightGray: '#D1D1D6',
  warning: '#FF9500', // Added for mapping to Paper's warning color
  success: '#34C759', // Added for mapping to Paper's success color
  error: '#FF3B30', // Added for mapping to Paper's error color
  placeholder: '#8A8A8E', // Added for mapping to Paper's placeholder
  inputBackground: '#FFFFFF',
  borderColor: '#D1D1D6',
  inputFocusBorder: '#007AFF', // Color for focused input border
  buttonDisabledBackground: '#E5E5EA', // Background color for disabled buttons
  info: '#007AFF', // Added for mapping to Paper's info color
  accent: '#FF3B30', // Added for mapping to Paper's secondary/accent
  // inputbackground: '#F2F2F7', // Corrected below
};

export const darkColors = {
  primary: '#0A84FF',
  secondary: '#FF453A',
  background: '#000000',
  cardBackground: Platform.OS === 'ios' ? 'rgba(26, 26, 26, 0.85)' : 'rgba(26, 26, 26, 0.9)',
  text: '#FFFFFF',
  textMuted: '#8D8D93', // Used for muted text in dark mode
  subtleText: '#8D8D93',
  surfaceMuted: '#3A3A3C', // Used for muted surfaces in dark mode
  surfaceSuccessMuted: '#1C1C1E', // For success muted surfaces
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8D8D93',
  lightGray: '#3A3A3C',
  warning: '#FF9F0A', // Added for mapping to Paper's warning color
  success: '#34C759', // Added for mapping to Paper's success color
  error: '#FF453A', // Added for mapping to Paper's error color
  placeholder: '#8D8D93', // Added for mapping to Paper's placeholder
  inputBackground: '#1C1C1E',
  borderColor: '#3A3A3C',
  inputFocusBorder: '#0A84FF', // Color for focused input border
  buttonDisabledBackground: '#2C2C2E', // Background color for disabled buttons
  info: '#0A84FF', // Added for mapping to Paper's info color
  accent: '#FF453A', // Added for mapping to Paper's secondary/accent
  // inputbackground: '#1C1C1E', // Corrected below
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
  roundness: commonStyles.ROUNDNESS.medium, // Default roundness for components
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    accent: lightColors.accent, // Maintained for compatibility if used
    success: lightColors.success, // Corrected mapping
    warning: lightColors.warning,
    error: lightColors.error,
    text: lightColors.text, // Corrected mapping
    textMuted: lightColors.textMuted,
    secondary: lightColors.accent, // MD3 uses 'secondary' for accent-like colors
    background: lightColors.background,
    surface: lightColors.cardBackground, // Mapping cardBackground to surface
    onSurface: lightColors.text, // Text color on surface
    onSurfaceVariant: lightColors.subtleText, // Muted text color on surface
    surfaceMuted: lightColors.surfaceMuted,
    surfaceSuccessMuted: lightColors.surfaceSuccessMuted,
    outline: lightColors.borderColor, // Default border color
    border: lightColors.borderColor, // Alias for outline for some components
    surfaceVariant: lightColors.inputBackground, // Background for elements like InputText, Chip etc.
    customWhite: lightColors.white,
    customBlack: lightColors.black,
    customGray: lightColors.gray,
    white: lightColors.white,
    black: lightColors.black,
    grey: lightColors.gray, // Paper's grey
    placeholder: lightColors.placeholder, // Explicitly map placeholder
    customLightGray: lightColors.lightGray,
    inputBackground: lightColors.inputBackground, // Specific for inputs if needed differently from surfaceVariant
    inputFocusBorder: lightColors.inputFocusBorder,
    buttonDisabledBackground: lightColors.buttonDisabledBackground,
    info: lightColors.info,
    originalSecondary: lightColors.secondary,
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}),
  SPACING: commonStyles.SPACING,
  BORDER_RADIUS: commonStyles.BORDER_RADIUS, // Keep custom border radius if needed alongside Paper's roundness
  ELEVATION: commonStyles.ELEVATION, // Custom elevation values
  BLUR_EFFECT: {
    tint: 'light' as 'light' | 'dark' | 'default',
    intensity: Platform.OS === 'ios' ? 80 : 100,
  },
  MODE: 'light',
  FONTS: commonStyles.FONTS, // Keep original fonts for direct access if needed
};

export const PaperDarkTheme = {
  ...MD3DarkTheme,
  roundness: commonStyles.ROUNDNESS.medium, // Default roundness for components
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    accent: darkColors.accent, // Maintained for compatibility if used
    success: darkColors.success, // Corrected mapping
    warning: darkColors.warning,
    error: darkColors.error,
    text: darkColors.text, // Corrected mapping
    textMuted: darkColors.textMuted,
    secondary: darkColors.accent, // MD3 uses 'secondary' for accent-like colors
    background: darkColors.background,
    surface: darkColors.cardBackground, // Mapping cardBackground to surface
    surfaceMuted: darkColors.surfaceMuted,
    surfaceSuccessMuted: darkColors.surfaceSuccessMuted,
    onSurface: darkColors.text, // Text color on surface
    onSurfaceVariant: darkColors.subtleText, // Muted text color on surface
    outline: darkColors.borderColor, // Default border color
    border: darkColors.borderColor, // Alias for outline for some components
    surfaceVariant: darkColors.inputBackground, // Background for elements like InputText, Chip etc.
    customWhite: darkColors.white,
    customBlack: darkColors.black,
    customGray: darkColors.gray,
    white: darkColors.white,
    black: darkColors.black,
    grey: darkColors.gray, // Paper's grey
    placeholder: darkColors.placeholder, // Explicitly map placeholder
    customLightGray: darkColors.lightGray,
    inputBackground: darkColors.inputBackground, // Specific for inputs if needed differently from surfaceVariant
    inputFocusBorder: darkColors.inputFocusBorder,
    buttonDisabledBackground: darkColors.buttonDisabledBackground,
    info: darkColors.info,
    originalSecondary: darkColors.secondary,
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}),
  SPACING: commonStyles.SPACING,
  BORDER_RADIUS: commonStyles.BORDER_RADIUS, // Keep custom border radius if needed alongside Paper's roundness
  ELEVATION: commonStyles.ELEVATION, // Custom elevation values
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

// Correcting the naming convention for inputbackground in lightColors and darkColors
// This is done by ensuring the theme objects use the corrected names (inputBackground)
// and removing the old misnamed 'inputbackground' if it was defined separately.
// The changes above in lightColors and darkColors already removed the misnamed 'inputbackground'
// and expect 'inputBackground' to be used.
// The PaperLightTheme and PaperDarkTheme mappings for surfaceVariant and inputBackground
// already use 'inputBackground', so those are correct.
