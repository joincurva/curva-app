import React, { useEffect } from "react";
import { reportAppOpen } from "../lib/install";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";
import { AppErrorBoundary } from "../components/error-boundary";
export default function Root() {
  useEffect(() => {
    void reportAppOpen();
    // Tapping a follow alert opens that artist's or team's sales in Curva.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const performer = response.notification.request.content.data?.performer;
      if (typeof performer === "string" && /^[a-z0-9-]{2,80}$/.test(performer)) router.push(`/presales/${performer}`);
      else if (response.notification.request.content.data?.show) router.push("/(tabs)");
    });
    return () => sub.remove();
  }, []);
  return (
    <AppErrorBoundary>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.canvas },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ title: "", headerBackTitle: "Back" }} />
          <Stack.Screen name="sale/[key]" options={{ title: "", headerBackTitle: "Back" }} />
          <Stack.Screen name="show/[id]" options={{ title: "", headerBackTitle: "Back" }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen
            name="auth"
            options={{ title: "Sign in", presentation: "modal" }}
          />
          <Stack.Screen
            name="support"
            options={{ title: "Support", presentation: "modal" }}
          />
        </Stack>
      </SessionProvider>
    </AppErrorBoundary>
  );
}
