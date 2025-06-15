// File: app/_layout.tsx
import { BlurView } from 'expo-blur';
import { Stack } from "expo-router";
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper'; // Import PaperProvider
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'; // Import ThemeProvider and useTheme

// RootLayoutNav component to consume theme after provider is set up
function RootLayoutNav() {
  const { theme } = useTheme(); // Now we can use the theme from context

  if (!theme || !theme.colors) {
    return null; // Or a loading indicator, or some fallback UI
  }

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background, // Use theme from context (Paper theme structure)
          },
          headerTintColor: theme.colors.primary, // Use theme from context (Paper theme structure)
          headerTitleStyle: {
            fontFamily: theme.FONTS.bold, // Assuming FONTS is still available at the root of your theme
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
                tint={theme.BLUR_EFFECT.tint} // Use theme from context
                intensity={theme.BLUR_EFFECT.intensity}
                style={StyleSheet.absoluteFill}
              />
            ),
            headerTintColor: theme.colors.primary, // Ensure modal header icons/text also use theme (Paper theme structure)
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* index.tsx handles the initial redirect, so no Stack.Screen name="index" is needed here
            if index.tsx only contains a Redirect. If app/index.tsx were a visible screen,
            it would need a Stack.Screen entry. */}
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
