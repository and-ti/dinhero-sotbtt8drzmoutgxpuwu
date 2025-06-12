// File: app/_layout.tsx
import { Stack } from "expo-router";
import theme from '../src/styles/theme';
import { BlurView } from 'expo-blur'; // Import BlurView
import { StyleSheet } from 'react-native'; // Import StyleSheet

export default function RootLayout() {
  // const { isAuthenticated } = useAuth(); // Example for future conditional navigation
  // For now, navigation is driven by app/index.tsx redirecting to login,
  // and login.tsx redirecting to (tabs)/dashboard on success.

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.COLORS.background,
        },
        headerTintColor: theme.COLORS.primary,
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
          headerTransparent: true, // Make header transparent to show blur underneath
          headerStyle: {
            backgroundColor: 'transparent', // Ensure header background is transparent
          },
          headerBackground: () => (
            <BlurView
              tint={theme.BLUR_EFFECT.tint}
              intensity={theme.BLUR_EFFECT.intensity}
              style={StyleSheet.absoluteFill} // Make BlurView fill the header area
            />
          ),
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* index.tsx handles the initial redirect, so no Stack.Screen name="index" is needed here
          if index.tsx only contains a Redirect. If app/index.tsx were a visible screen,
          it would need a Stack.Screen entry. */}
    </Stack>
  );
}
