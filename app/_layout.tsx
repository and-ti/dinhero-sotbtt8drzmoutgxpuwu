// File: app/_layout.tsx
import { BlurView } from 'expo-blur';
import { Stack } from "expo-router";
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

const LoadingIndicator = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
    <ActivityIndicator size="large" />
  </View>
);

function RootLayoutNav() {
  const { theme, isThemeReady } = useTheme(); // Destructure isThemeReady

  // Primary check: if theme is not ready, show loading indicator.
  if (!isThemeReady) {
    return <LoadingIndicator />;
  }

  // Secondary check (if theme is ready): validate specific theme properties.
  // This is an additional safeguard. In a perfect scenario, if isThemeReady is true, these should also be true.
  if (
    !theme || // Should be redundant if isThemeReady is true, but good for safety
    !theme.colors ||
    typeof theme.colors.background === 'undefined' ||
    typeof theme.colors.primary === 'undefined' ||
    !theme.FONTS ||
    typeof theme.FONTS.bold === 'undefined' ||
    typeof theme.FONTS.sizes === 'undefined' ||
    !theme.BLUR_EFFECT ||
    typeof theme.BLUR_EFFECT.tint === 'undefined'
  ) {
    // This case should ideally not be hit if isThemeReady=true means the theme is valid.
    // Log an error or show a specific error UI if this happens, as it indicates a problem in ThemeProvider logic.
    console.error("ThemeContext reported theme as ready, but critical properties are missing.", theme);
    return <LoadingIndicator />; // Or a more specific error display
  }

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontFamily: theme.FONTS.bold,
            fontSize: theme.FONTS.sizes.large,
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            title: "Configurações",
            presentation: "modal",
            headerTransparent: true,
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerBackground: () => (
              <BlurView
                tint={theme.BLUR_EFFECT.tint}
                intensity={theme.BLUR_EFFECT.intensity}
                style={StyleSheet.absoluteFill}
              />
            ),
            headerTintColor: theme.colors.primary,
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
