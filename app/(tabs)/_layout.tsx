// File: app/(tabs)/_layout.tsx
import { Tabs, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function TabLayout() { // Renamed function for clarity
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

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
      })}
    >
      <Tabs.Screen
        name="dashboard" // Corresponds to app/(tabs)/dashboard.tsx
        options={{
          title: "Dashboard",
          headerRight: () => (
            <Link href="/settings" asChild> {/* Should resolve to app/(tabs)/settings.tsx */}
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="person-circle-outline"
                    size={25}
                    color="gray"
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
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
      <Tabs.Screen
        name="settings" // Corresponds to app/(tabs)/settings.tsx
        options={{
          title: "Configurações",
          href: null, // Hides it from being a directly navigable tab, typically shown via other means
        }}
      />
    </Tabs>
  );
}
