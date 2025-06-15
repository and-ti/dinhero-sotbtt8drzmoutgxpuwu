// src/context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { getTheme, PaperThemeType } from '../styles/theme';

type Theme = PaperThemeType;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  currentMode: 'light' | 'dark';
  isThemeReady: boolean; // New flag
}

// Update the context with a default value including isThemeReady
const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light'), // Default theme
  toggleTheme: () => console.warn('ThemeProvider not found'),
  currentMode: 'light',
  isThemeReady: false, // Default to false
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  // Effect to load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      setIsLoadingTheme(true); // Explicitly set loading to true at the start
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode === 'light' || savedMode === 'dark') {
          setCurrentMode(savedMode);
        } else if (systemColorScheme) {
          // Fallback to system preference if no saved mode
          setCurrentMode(systemColorScheme);
        }
        // If no savedMode and no systemColorScheme, it defaults to 'light' via useState initial
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // In case of error, fallback to system or default 'light'
        setCurrentMode(systemColorScheme || 'light');
      } finally {
        setIsLoadingTheme(false); // Set to false after attempting to load
      }
    };
    loadThemePreference();
  }, [systemColorScheme]); // Rerun if systemColorScheme changes and no user pref is set

  // Effect to listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Check if a user preference is already set. If so, don't override with system change.
      AsyncStorage.getItem('themeMode').then(savedMode => {
        if (!savedMode && colorScheme) {
          // No user preference, so update to the new system theme
          setCurrentMode(colorScheme);
        }
      });
    });
    return () => subscription.remove();
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const theme = getTheme(currentMode);

  const toggleTheme = async () => {
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setCurrentMode(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  if (isLoadingTheme) {
    // While loading, ThemeProvider returns null, so children are not rendered.
    // The context value provided when not loading will have isThemeReady: true.
    return null;
  }

  // Theme is loaded and ready
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentMode, isThemeReady: true }}>
      {children}
    </ThemeContext.Provider>
  );
};
