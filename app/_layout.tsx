import { Tabs, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function RootLayout() {
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
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerRight: () => (
            <Link href="/settings" asChild>
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
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
          href: null,
        }}
      />
      {/* Add this entry to hide the index route from tabs */}
      <Tabs.Screen
        name="index" // This corresponds to app/index.tsx
        options={{
          href: null, // Hides it from the tab bar
        }}
      />
    </Tabs>
  );
}
