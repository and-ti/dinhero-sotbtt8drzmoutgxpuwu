// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Or expo-secure-store
import { getTheme } from '../styles/theme'; // Import the getTheme function

// Define the shape of the theme object provided by getTheme
// This should match the return type of getTheme
type Theme = ReturnType<typeof getTheme>;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  currentMode: 'light' | 'dark';
}

// Create the context with a default value.
// The default theme can be light, and toggleTheme a no-op until provider is mounted.
const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light'), // Default theme
  toggleTheme: () => console.warn('ThemeProvider not found'),
  currentMode: 'light',
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get system preference
  const systemColorScheme = Appearance.getColorScheme(); // 'light', 'dark', or null
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode === 'light' || savedMode === 'dark') {
          setCurrentMode(savedMode);
        } else if (systemColorScheme) {
          // If no saved theme, use system preference
          setCurrentMode(systemColorScheme);
        }
        // If no saved theme and no system preference, it defaults to 'light' from useState
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fallback to system or default if loading fails
        setCurrentMode(systemColorScheme || 'light');
      }
    };
    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setCurrentMode(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // If user has a saved preference, don't override with system changes
      // unless you want the app to always follow system.
      // For this implementation, we prioritize saved preference.
      // If no saved preference, then follow system.
      AsyncStorage.getItem('themeMode').then(savedMode => {
        if (!savedMode && colorScheme) {
          setCurrentMode(colorScheme);
        }
      });
    });
    return () => subscription.remove();
  }, []);

  const theme = getTheme(currentMode);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
