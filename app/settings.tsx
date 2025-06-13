// app/settings.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../src/context/ThemeContext'; // Adjust path as necessary
import { commonStyles } from '../src/styles/theme'; // For common font/spacing if needed

export default function SettingsScreen() {
  const { theme, toggleTheme, currentMode } = useTheme();
  const styles = getDynamicStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Modo Escuro</Text>
        <Switch
          trackColor={{ false: theme.COLORS.lightGray, true: theme.COLORS.primary }}
          thumbColor={Platform.OS === 'android' ? theme.COLORS.white : ''} // Android thumb color often white
          ios_backgroundColor={theme.COLORS.lightGray} // Background of the track for iOS
          onValueChange={toggleTheme}
          value={currentMode === 'dark'}
        />
      </View>
      {/* Add more settings options here if needed */}
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    padding: commonStyles.SPACING.medium,
    backgroundColor: theme.COLORS.background,
  },
  title: {
    fontSize: commonStyles.FONTS.sizes.xlarge,
    fontFamily: commonStyles.FONTS.bold,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.large,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: commonStyles.SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.COLORS.borderColor,
  },
  optionText: {
    fontSize: commonStyles.FONTS.sizes.medium,
    fontFamily: commonStyles.FONTS.regular,
    color: theme.COLORS.text,
  },
});
