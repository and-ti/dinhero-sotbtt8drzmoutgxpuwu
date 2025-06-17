// src/context/ThemeContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { getTheme, PaperThemeType } from '../styles/theme';

// ... (Theme, ThemeContextType, e createContext continuam iguais)

interface ThemeContextType {
  theme: PaperThemeType;
  toggleTheme: () => void;
  currentMode: 'light' | 'dark';
  isThemeReady: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light'),
  toggleTheme: () => console.warn('ThemeProvider not found'),
  currentMode: 'light',
  isThemeReady: false,
});


export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  const [isThemeReady, setIsThemeReady] = useState(false); // Usaremos esta flag

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode === 'light' || savedMode === 'dark') {
          setCurrentMode(savedMode);
        } else if (systemColorScheme) {
          setCurrentMode(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        // Sinaliza que o tema está pronto para ser usado
        setIsThemeReady(true);
      }
    };
    loadThemePreference();
  }, [systemColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem('themeMode').then(savedMode => {
        if (!savedMode && colorScheme) {
          setCurrentMode(colorScheme);
        }
      });
    });
    return () => subscription.remove();
  }, []);

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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentMode, isThemeReady }}>
      {children}
    </ThemeContext.Provider>
  );
};