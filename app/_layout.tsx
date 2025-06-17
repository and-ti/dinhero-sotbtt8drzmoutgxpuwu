// File: app/_layout.tsx
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Stack } from "expo-router";
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

const LoadingIndicator = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
    <ActivityIndicator size="large" />
  </View>
);

function RootLayoutNav() {
  const { theme, isThemeReady } = useTheme();

  // Esta verificação agora funciona como esperado, pois o provider não retorna mais null.
  if (!isThemeReady) {
    return <LoadingIndicator />;
  }

  // Cria o tema para a biblioteca de navegação
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      primary: theme.colors.primary,
      text: theme.colors.primary,
      card: theme.colors.background,
      border: theme.colors.outline || DefaultTheme.colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <PaperProvider theme={theme}>
        <Stack>
          {/* Suas telas */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              title: "Configurações",
              presentation: "modal",
              headerTransparent: true,
              headerBackground: () => (
                <BlurView
                  tint={theme.BLUR_EFFECT.tint}
                  intensity={theme.BLUR_EFFECT.intensity}
                  style={StyleSheet.absoluteFill}
                />
              ),
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}