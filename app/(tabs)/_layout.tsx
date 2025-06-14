// File: app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native"; // Pressable might be removed if only IconButton is used
import { useTheme } from '../../src/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { IconButton } from 'react-native-paper'; // Import IconButton

export default function TabLayout() {
  const { theme } = useTheme(); // theme is PaperThemeType

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // ... (icon logic remains the same)
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'alert-circle-outline'; // Default icon

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
          // Ensure Ionicons is used here, not trying to change all icons to Paper ones yet
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary, // Updated to Paper theme
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant, // Updated to Paper theme
        tabBarStyle: {
          backgroundColor: 'transparent', // Keeping transparent for BlurView
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0, // No border for BlurView
          elevation: 0, // No elevation for BlurView
        },
        tabBarBackground: () => (
          <BlurView
            tint={theme.BLUR_EFFECT.tint} // This should correctly use 'light' or 'dark' from Paper theme
            intensity={theme.BLUR_EFFECT.intensity} // Keep intensity as defined
            style={StyleSheet.absoluteFill}
          />
        ),
        headerStyle: {
          backgroundColor: theme.colors.surface, // Updated to Paper theme (mapped from cardBackground)
        },
        headerTintColor: theme.colors.primary, // Updated to Paper theme
        headerTitleStyle: {
          fontFamily: theme.FONTS.bold, // Assuming FONTS is still in theme and valid
          fontSize: theme.FONTS.sizes.large, // Assuming FONTS is still in theme and valid
          // Consider using theme.fonts.titleLarge or similar if fonts are fully configured in Paper theme
        },
      })}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerRight: () => {
            const router = useRouter();
            return (
              <IconButton
                icon="account-circle-outline" // MaterialCommunityIcons equivalent
                iconColor={theme.colors.onSurfaceVariant} // Or theme.colors.primary
                size={25}
                onPress={() => router.push('/settings')}
                style={{ marginRight: 10 }} // Adjust margin as needed
              />
            );
          },
        }}
      />
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
