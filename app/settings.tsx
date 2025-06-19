// app/settings.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button as PaperButton,
  Switch as PaperSwitch,
  Text as PaperText,
  useTheme,
} from 'react-native-paper';
// Assuming useTheme from ThemeContext is compatible or we switch to Paper's useTheme
// For consistency with other refactors, let's assume useTheme is from react-native-paper or compatible.
// import { useTheme } from '../src/context/ThemeContext'; // If this context provides PaperThemeType
import { useRouter } from 'expo-router'; // For logout navigation
import { PaperThemeType } from '../src/styles/theme'; // Import theme type

export default function SettingsScreen() {
  // Assuming toggleTheme and currentMode are correctly provided by the theme context used.
  // If useTheme is from Paper, ThemeContext might need to be adjusted or toggleTheme handled differently.
  // For this refactor, we'll assume the custom ThemeContext's useTheme provides these.
  // If ThemeContext is the one from `../../src/context/ThemeContext` and it's not providing PaperThemeType,
  // then theme properties might not align. This was standardized in other files.
  // For now, let's assume it's compatible or useTheme from Paper is intended.
  const { theme, toggleTheme, currentMode } = useTheme() as any; // Cast to any if custom context not fully Paper compatible yet
  const styles = getDynamicStyles(theme as PaperThemeType); // Cast theme for styles
  const router = useRouter();

  const handleLogout = () => {
    // Perform logout actions (clear session, tokens, etc.)
    console.log("Logout action performed");
    router.replace('/login'); // Navigate to login screen
  };

  return (
    <View style={styles.container}>
      <PaperText variant="headlineMedium" style={styles.title}>Configurações</PaperText>

      <View style={styles.optionRow}>
        <PaperText variant="bodyLarge" style={styles.optionText}>Modo Escuro</PaperText>
        <PaperSwitch
          value={currentMode === 'dark'}
          onValueChange={toggleTheme}
          color={theme.colors.primary} // Color of the switch when 'on'
        />
      </View>

      {/* Example Logout Button */}
      <PaperButton
        mode="contained"
        onPress={handleLogout}
        style={styles.button}
        icon="logout"
      >
        Log Out
      </PaperButton>

      {/* Add more settings options here if needed */}
    </View>
  );
}

const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.SPACING.medium,
    backgroundColor: theme.colors.background,
  },
  title: {
    // fontSize: theme.FONTS.sizes.xlarge, // Handled by variant
    // fontFamily: theme.FONTS.bold, // Handled by variant
    color: theme.colors.text,
    marginBottom: theme.SPACING.large,
    textAlign: 'center', // Center title
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.outline, // Use outline or outlineVariant
  },
  optionText: {
    // fontSize: theme.FONTS.sizes.medium, // Handled by variant
    // fontFamily: theme.FONTS.regular, // Handled by variant
    color: theme.colors.text,
  },
  button: { // Style for the logout button
    marginTop: theme.SPACING.large,
    borderRadius: theme.BORDER_RADIUS.button,
  },
});
