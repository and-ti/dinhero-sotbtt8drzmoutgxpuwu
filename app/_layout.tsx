// File: app/_layout.tsx
import { Stack } from "expo-router";
// import { useAuth } // Hypothetical auth hook for future session management

export default function RootLayout() {
  // const { isAuthenticated } = useAuth(); // Example for future conditional navigation
  // For now, navigation is driven by app/index.tsx redirecting to login,
  // and login.tsx redirecting to (tabs)/dashboard on success.

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Configurações", presentation: "modal" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* index.tsx handles the initial redirect, so no Stack.Screen name="index" is needed here
          if index.tsx only contains a Redirect. If app/index.tsx were a visible screen,
          it would need a Stack.Screen entry. */}
    </Stack>
  );
}
