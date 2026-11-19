import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { EventCard } from "../../components/event-card";
import {
  Button,
  Heading,
  Screen,
  State,
  Title,
  Body,
} from "../../components/ui";
import { getEvents, request } from "../../lib/api";
import { useSession } from "../../lib/session";
import type { Alert, Event } from "../../lib/types";
import { space } from "../../lib/theme";
export default function Home() {
  const { session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    await Promise.resolve();
    setError("");
    setLoading(true);
    try {
      const [e, a] = await Promise.all([
        getEvents(new URLSearchParams({ country: "US", page: "0" })),
        session
          ? request<{ alerts: Alert[] }>(
              "/api/ticket-alerts",
              {},
              session.token,
            )
          : Promise.resolve({ alerts: [] }),
      ]);
      setEvents(e.events);
      setAlerts(a.alerts);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not refresh Curva.");
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <Screen>
      <FlatList
        data={events.slice(0, 8)}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EventCard event={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.eyebrow}>FOR YOU</Text>
            <Title>Know what’s worth your attention.</Title>
            <Body muted>
              {session
                ? "Real events and alerts, brought together for you."
                : "Discover real events now. Sign in to add your alerts and interests."}
            </Body>
            {!session && (
              <Button
                label="Sign in to personalize"
                onPress={() => router.push("/auth")}
              />
            )}
            <Heading>Happening soon</Heading>
            {loading && !events.length && (
              <State
                kind="loading"
                message="Checking the official event catalog…"
              />
            )}
            {error && <State kind="error" message={error} onRetry={load} />}
          </View>
        }
        ListFooterComponent={
          <View style={s.footer}>
            <Heading>Your alerts</Heading>
            <Body muted>
              {session
                ? alerts.length
                  ? `${alerts.filter((a) => a.status === "active").length} active Ticket Alerts.`
                  : "Nothing is being monitored yet."
                : "Sign in to see what Curva is monitoring."}
            </Body>
            <Button
              variant="secondary"
              label="Ask Curva"
              onPress={() => router.push("/(tabs)/ask")}
            />
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <State
              kind="empty"
              message="No verified events are available right now. Pull to refresh."
            />
          ) : null
        }
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 120 },
  header: { gap: space.lg, marginBottom: space.lg },
  footer: { gap: space.md, marginTop: space.xl },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
});
