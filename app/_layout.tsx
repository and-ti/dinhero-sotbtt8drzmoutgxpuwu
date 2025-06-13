// File: app/_layout.tsx
import { Stack } from "expo-router";
// Removed direct theme import: import theme from '../src/styles/theme';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'; // Import ThemeProvider and useTheme

// RootLayoutNav component to consume theme after provider is set up
function RootLayoutNav() {
  const { theme } = useTheme(); // Now we can use the theme from context

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.COLORS.background, // Use theme from context
        },
        headerTintColor: theme.COLORS.primary, // Use theme from context
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
              tint={theme.BLUR_EFFECT.tint} // Use theme from context
              intensity={theme.BLUR_EFFECT.intensity}
              style={StyleSheet.absoluteFill}
            />
          ),
          headerTintColor: theme.COLORS.primary, // Ensure modal header icons/text also use theme
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* index.tsx handles the initial redirect, so no Stack.Screen name="index" is needed here
          if index.tsx only contains a Redirect. If app/index.tsx were a visible screen,
          it would need a Stack.Screen entry. */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
