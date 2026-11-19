import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { brand } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// One icon family, one size, filled when selected: every tab reads the same.
const icon =
  (name: string) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={(focused ? name : `${name}-outline`) as IconName} size={24} color={color as string} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: brand.mist,
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 20,
          backgroundColor: brand.navy,
          borderTopColor: brand.navy,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="presales" options={{ title: "Presales", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: icon("search") }} />
      <Tabs.Screen name="ask" options={{ href: null, title: "Ask Curva" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts", tabBarIcon: icon("notifications") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("person-circle") }} />
    </Tabs>
  );
}
