// File: app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import theme from '../../src/styles/theme';
import { BlurView } from 'expo-blur'; // Import BlurView

export default function TabLayout() { // Renamed function for clarity
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'alert-circle-outline';

          if (route.name === "dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "transacoes") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "debitos") {
            iconName = focused ? "card" : "card-outline";
          } else if (route.name === "metas") {
            iconName = focused ? "ribbon" : "ribbon-outline";
          } else if (route.name === "orcamentos") {
            iconName = focused ? "calculator" : "calculator-outline";
          }
          // Ensure iconName is a valid Ionicons name or handle default
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.COLORS.primary,
        tabBarInactiveTintColor: theme.COLORS.gray,
        tabBarStyle: {
          backgroundColor: 'transparent', // Make tab bar background transparent for blur
          position: 'absolute', // Important for blur to overlay content correctly
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0, // Remove default top border
          elevation: 0, // Remove shadow on Android
        },
        tabBarBackground: () => (
          <BlurView
            tint={theme.BLUR_EFFECT.tint}
            intensity={theme.BLUR_EFFECT.intensity}
            style={StyleSheet.absoluteFill} // Make BlurView fill the tab bar area
          />
        ),
        headerStyle: {
          backgroundColor: theme.COLORS.cardBackground, // This still uses a non-blur background
        },
        headerTintColor: theme.COLORS.primary,
        headerTitleStyle: {
          fontFamily: theme.FONTS.bold,
          fontSize: theme.FONTS.sizes.large,
        },
      })}
    >
      {/* ... Tab.Screen definitions ... */}
      <Tabs.Screen
        name="dashboard" // Corresponds to app/(tabs)/dashboard.tsx
        options={{
          title: "Dashboard",
          headerRight: () => {
            const router = useRouter(); // Hook must be called inside the functional component
            return (
              <Pressable onPress={() => router.push('/settings')}>
                {({ pressed }) => (
                  <Ionicons
                    name="person-circle-outline"
                    size={25}
                    color={theme.COLORS.gray} // Use theme color
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            );
          },
        }}
      />
      <Tabs.Screen
        name="transacoes" // Corresponds to app/(tabs)/transacoes.tsx
        options={{
          title: "Transações",
        }}
      />
      <Tabs.Screen
        name="debitos" // Corresponds to app/(tabs)/debitos.tsx
        options={{
          title: "Débitos",
        }}
      />
      <Tabs.Screen
        name="metas" // Corresponds to app/(tabs)/metas.tsx
        options={{
          title: "Metas",
        }}
      />
      <Tabs.Screen
        name="orcamentos" // Corresponds to app/(tabs)/orcamentos.tsx
        options={{
          title: "Orçamentos",
        }}
      />
    </Tabs>
  );
}
