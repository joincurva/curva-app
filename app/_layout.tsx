import React, { useEffect } from "react";
import { reportAppOpen } from "../lib/install";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";
import { AppErrorBoundary } from "../components/error-boundary";
export default function Root() {
  useEffect(() => {
    void reportAppOpen();
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
