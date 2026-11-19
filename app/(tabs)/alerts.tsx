import React, { useCallback, useEffect, useState } from "react";
import { Alert as NativeAlert, FlatList, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Body,
  Button,
  Card,
  Input,
  Screen,
  State,
  Title,
} from "../../components/ui";
import { request } from "../../lib/api";
import { useSession } from "../../lib/session";
import type { Alert } from "../../lib/types";
import { space } from "../../lib/theme";
export default function Alerts() {
  const { session } = useSession();
  const params = useLocalSearchParams<{
    eventId?: string;
    eventName?: string;
    venue?: string;
    city?: string;
  }>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [query, setQuery] = useState(params.eventName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    await Promise.resolve();
    if (!session) return;
    setLoading(true);
    try {
      setAlerts(
        (
          await request<{ alerts: Alert[] }>(
            "/api/ticket-alerts",
            {},
            session.token,
          )
        ).alerts,
      );
    } catch (x) {
      setError(x instanceof Error ? x.message : "Alerts unavailable.");
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const create = async () => {
    if (!session || query.trim().length < 2) return;
    setLoading(true);
    try {
      await request(
        "/api/ticket-alerts",
        {
          method: "POST",
          body: JSON.stringify({
            email: session.user.email,
            query: query.trim(),
            eventId: params.eventId,
            eventName: params.eventName,
            venue: params.venue,
            city: params.city,
            countryCode: "US",
            quantity: 2,
            notificationPreference: "email",
          }),
        },
        session.token,
      );
      setQuery("");
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Alert could not be created.");
    } finally {
      setLoading(false);
    }
  };
  const change = async (a: Alert, status?: "active" | "paused") => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      await request(
        `/api/ticket-alerts/${encodeURIComponent(a.id)}`,
        {
          method: status ? "PATCH" : "DELETE",
          body: status ? JSON.stringify({ status }) : undefined,
        },
        session.token,
      );
      await load();
    } catch (x) {
      setError(
        x instanceof Error
          ? x.message
          : `Alert could not be ${status ? "updated" : "deleted"}.`,
      );
    } finally {
      setLoading(false);
    }
  };
  if (!session)
    return (
      <Screen>
        <View style={s.content}>
          <Title>Ticket Alerts</Title>
          <Body muted>
            Sign in to create and manage monitoring tied to your Curva
            membership.
          </Body>
          <Button label="Sign in" onPress={() => router.push("/auth")} />
        </View>
      </Screen>
    );
  return (
    <Screen>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.form}>
            <Title>Ticket Alerts</Title>
            <Body muted>
              Email remains the canonical alert channel. Push delivery is not
              active.
            </Body>
            <Input
              accessibilityLabel="Event or artist to monitor"
              placeholder="Event or artist"
              value={query}
              onChangeText={setQuery}
            />
            <Button
              label="Create email alert"
              disabled={loading || query.trim().length < 2}
              onPress={create}
            />
            {error && <State kind="error" message={error} onRetry={load} />}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Body>{item.eventName ?? item.query}</Body>
            <Body muted>
              {item.status} ·{" "}
              {item.monitoringStatus ??
                "Monitoring status follows server state"}
            </Body>
            <View style={s.row}>
              {item.status === "active" ? (
                <Button
                  variant="secondary"
                  label="Pause"
                  disabled={loading}
                  onPress={() => void change(item, "paused")}
                />
              ) : item.status === "paused" ? (
                <Button
                  variant="secondary"
                  label="Resume"
                  disabled={loading}
                  onPress={() => void change(item, "active")}
                />
              ) : null}
              <Button
                variant="danger"
                label="Delete"
                disabled={loading}
                onPress={() =>
                  NativeAlert.alert(
                    "Delete Ticket Alert?",
                    "Curva will stop monitoring this alert.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => void change(item),
                      },
                    ],
                  )
                }
              />
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          !loading ? (
            <State
              kind="empty"
              message="No Ticket Alerts yet. Create one for an event you care about."
            />
          ) : (
            <State kind="loading" message="Loading Ticket Alerts…" />
          )
        }
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 120 },
  form: { gap: space.md, marginBottom: space.xl },
  row: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
});
