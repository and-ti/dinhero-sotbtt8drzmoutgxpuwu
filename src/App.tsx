import React from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { FABProvider } from './contexts/FABContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import GradientBackground from './components/GradientBackground';
import AppNavigator from './navigation';
import { createPaperTheme } from './theme/paperTheme';

function MainApp() {
  const { themeMode } = useTheme();
  const paperTheme = createPaperTheme(themeMode === 'dark');
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };
  return (
    <PaperProvider theme={paperTheme}>
      <GradientBackground>
        <NavigationContainer theme={navTheme} key="main-navigation">
          <AppNavigator />
        </NavigationContainer>
      </GradientBackground>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FABProvider>
          <MainApp />
        </FABProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 