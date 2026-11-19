import React from "react";
import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { brand } from "../../lib/theme";
const Icon = ({ label, color }: { label: string; color: ColorValue }) => (
  <Text
    accessibilityElementsHidden
    style={{ color, fontSize: 18, fontWeight: "800" }}
  >
    {label}
  </Text>
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Icon color={color} label="⌂" />,
        }}
      />
      <Tabs.Screen
        name="presales"
        options={{
          title: "Presales",
          tabBarIcon: ({ color }) => <Icon color={color} label="◷" />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Icon color={color} label="⌕" />,
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          href: null,
          title: "Ask Curva",
          tabBarIcon: ({ color }) => <Icon color={color} label="C" />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Icon color={color} label="◉" />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <Icon color={color} label="●" />,
        }}
      />
    </Tabs>
  );
}
