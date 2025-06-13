// File: app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
// import theme from '../../src/styles/theme'; // REMOVE THIS
import { useTheme } from '../../src/context/ThemeContext'; // ADD THIS
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { theme } = useTheme(); // ADD THIS

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // ... (icon logic remains the same)
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
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.COLORS.primary, // Use theme from hook
        tabBarInactiveTintColor: theme.COLORS.gray, // Use theme from hook
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={theme.BLUR_EFFECT.tint} // Use theme from hook
            intensity={theme.BLUR_EFFECT.intensity}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerStyle: {
          backgroundColor: theme.COLORS.cardBackground, // Use theme from hook
        },
        headerTintColor: theme.COLORS.primary, // Use theme from hook
        headerTitleStyle: {
          fontFamily: theme.FONTS.bold,
          fontSize: theme.FONTS.sizes.large,
        },
      })}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerRight: () => {
            // Note: `useRouter` is fine, but `useTheme` must be in the body of `TabLayout`
            const router = useRouter();
            return (
              <Pressable onPress={() => router.push('/settings')}>
                {({ pressed }) => (
                  <Ionicons
                    name="person-circle-outline"
                    size={25}
                    color={theme.COLORS.gray} // Use theme from hook
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            );
          },
        }}
      />
      {/* Other Tabs.Screen components... */}
      <Tabs.Screen
        name="transacoes"
        options={{
          title: "Transações",
        }}
      />
      <Tabs.Screen
        name="debitos"
        options={{
          title: "Débitos",
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: "Metas",
        }}
      />
      <Tabs.Screen
        name="orcamentos"
        options={{
          title: "Orçamentos",
        }}
      />
    </Tabs>
  );
}
