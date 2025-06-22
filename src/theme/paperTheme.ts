import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightTheme, darkTheme } from './styles';

export const createPaperTheme = (isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const colors = isDark ? darkTheme.colors : lightTheme.colors;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      primaryContainer: colors.primary + '20',
      secondary: colors.secondary,
      secondaryContainer: colors.secondary + '20',
      tertiary: colors.primary,
      tertiaryContainer: colors.primary + '20',
      surface: colors.surface,
      surfaceVariant: colors.card,
      background: colors.background,
      error: colors.error,
      errorContainer: colors.error + '20',
      onPrimary: colors.surface,
      onSecondary: colors.surface,
      onTertiary: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      onBackground: colors.text,
      onError: colors.surface,
      outline: colors.border,
      outlineVariant: colors.divider,
      shadow: colors.text,
      scrim: colors.overlay,
      inverseSurface: colors.card,
      inverseOnSurface: colors.text,
      inversePrimary: colors.primary,
      elevation: {
        level0: 'transparent',
        level1: colors.card,
        level2: colors.card,
        level3: colors.card,
        level4: colors.card,
        level5: colors.card,
      },
    },
  };
}; 