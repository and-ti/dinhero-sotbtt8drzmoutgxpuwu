// File: app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native"; // Added View, ActivityIndicator
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../src/context/ThemeContext';

// Define a simple loading component, can be shared or local
// Now accepts theme to avoid hardcoded background
const TabLoadingIndicator = ({ backgroundColor }: { backgroundColor?: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: backgroundColor || '#FFFFFF' }}>
    {/* Fallback to white if no background color is provided */}
    <ActivityIndicator size="large" color={backgroundColor ? (backgroundColor === '#000000' || backgroundColor === '#000' ? '#FFFFFF' : '#000000') : '#000000'} />
  </View>
);

export default function TabLayout() {
  const { theme, isThemeReady } = useTheme(); // Destructure isThemeReady

  if (!isThemeReady) {
    // Try to provide a sensible default background for the initial loading state
    // This is a guess; if theme takes long to load, this might be briefly visible.
    return <TabLoadingIndicator backgroundColor={theme?.colors?.background} />;
  }

  // Secondary checks for properties used directly by TabLayout
  // These should ideally be true if isThemeReady is true.
  if (
    !theme.colors ||
    typeof theme.colors.primary === 'undefined' ||
    typeof theme.colors.onSurfaceVariant === 'undefined' ||
    typeof theme.colors.surface === 'undefined' || // for headerStyle
    !theme.BLUR_EFFECT ||
    typeof theme.BLUR_EFFECT.tint === 'undefined' ||
    !theme.FONTS ||
    typeof theme.FONTS.bold === 'undefined' ||
    typeof theme.FONTS.sizes === 'undefined'
  ) {
    console.error("TabLayout: ThemeContext reported theme as ready, but critical properties for Tabs are missing.", theme);
    // Pass the current theme's background if available, even if other parts are missing
    return <TabLoadingIndicator backgroundColor={theme?.colors?.background} />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'alert-circle-outline';
          if (route.name === "dashboard") iconName = focused ? "home" : "home-outline";
          else if (route.name === "transacoes") iconName = focused ? "list" : "list-outline";
          else if (route.name === "debitos") iconName = focused ? "card" : "card-outline";
          else if (route.name === "metas") iconName = focused ? "ribbon" : "ribbon-outline";
          else if (route.name === "orcamentos") iconName = focused ? "calculator" : "calculator-outline";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
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
            tint={theme.BLUR_EFFECT.tint}
            intensity={theme.BLUR_EFFECT.intensity}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
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
            const router = useRouter(); // Hook inside options needs to be stable or memoized if complex
            return (
              <IconButton
                icon="account-circle-outline"
                iconColor={theme.colors.onSurfaceVariant} // Already themed
                size={25} // Size is a layout choice
                onPress={() => router.push('/settings')}
                style={{ marginRight: 10 }} // Margin is a layout choice
              />
            );
          },
        }}
      />
      <Tabs.Screen name="transacoes" options={{ title: "Transações" }} />
      <Tabs.Screen name="debitos" options={{ title: "Débitos" }} />
      <Tabs.Screen name="metas" options={{ title: "Metas" }} />
      <Tabs.Screen name="orcamentos" options={{ title: "Orçamentos" }} />
    </Tabs>
  );
}
