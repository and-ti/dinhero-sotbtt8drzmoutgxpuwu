import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../theme/styles';

type ThemeMode = 'light' | 'dark';

interface ThemeContextData {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = '@DinHero:theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    carregarTemaSalvo();
  }, []);

  const carregarTemaSalvo = async () => {
    try {
      const temaSalvo = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (temaSalvo === 'light' || temaSalvo === 'dark') {
        setThemeMode(temaSalvo as ThemeMode);
      } else {
        const colorScheme = Appearance.getColorScheme();
        setThemeMode(colorScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    }
  };

  const salvarTema = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const toggleTheme = () => {
    const novoModo = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(novoModo);
    salvarTema(novoModo);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    salvarTema(mode);
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{
      theme,
      themeMode,
      toggleTheme,
      setThemeMode: handleSetThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 