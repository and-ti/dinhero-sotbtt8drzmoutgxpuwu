import { Tabs, Link } from "expo-router"; // Added Link
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native"; // Added Pressable

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "dashboard") {
            iconName = focused ? "ios-home" : "ios-home-outline";
          } else if (route.name === "transacoes") {
            iconName = focused ? "ios-list" : "ios-list-outline";
          } else if (route.name === "debitos") {
            iconName = focused ? "ios-card" : "ios-card-outline";
          } else if (route.name === "metas") {
            iconName = focused ? "ios-ribbon" : "ios-ribbon-outline";
          } else if (route.name === "orcamentos") {
            iconName = focused ? "ios-calculator" : "ios-calculator-outline";
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
                    color="gray" // You can customize color
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
      {/* Defines the settings screen as a modal when navigated to from a tab.
          This is one way to handle it; alternatively, it can be a regular screen
          pushed onto the stack if not defined here.
          For simplicity and to ensure it's part of the known routes for the layout,
          defining it here. It won't appear as a tab.
      */}
      <Tabs.Screen
        name="settings" // Corresponds to app/settings.tsx
        options={{
          title: "Configurações",
          href: null, // Hides it from the tab bar
          // presentation: 'modal', // Optional: if you want it as a modal
        }}
      />
    </Tabs>
  );
}
