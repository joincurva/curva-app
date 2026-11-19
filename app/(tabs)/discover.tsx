import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { EventCard } from "../../components/event-card";
import { Button, Input, Screen, State, Title, Body } from "../../components/ui";
import { getEvents } from "../../lib/api";
import type { Event } from "../../lib/types";
import { space } from "../../lib/theme";
export default function Discover() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const search = useCallback(
    async (next = 0) => {
      setLoading(true);
      setError("");
      try {
        const p = new URLSearchParams({
          q,
          location,
          country: "US",
          page: String(next),
        });
        const r = await getEvents(p);
        setEvents((v) => (next ? [...v, ...r.events] : r.events));
        setPage(next);
        setMore(
          r.meta?.totalPages === undefined
            ? r.events.length > 0
            : next + 1 < r.meta.totalPages,
        );
      } catch (x) {
        setError(x instanceof Error ? x.message : "Search failed.");
      } finally {
        setLoading(false);
      }
    },
    [q, location],
  );
  return (
    <Screen>
      <FlatList
        data={events}
        keyExtractor={(e, i) => `${e.id}-${i}`}
        renderItem={({ item }) => <EventCard event={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.form}>
            <Title>Discover</Title>
            <Body muted>
              Search Curva’s canonical, provider-backed event catalog.
            </Body>
            <Input
              accessibilityLabel="Artist, team, venue, or event"
              placeholder="Artist, team, venue, or event"
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              onSubmitEditing={() => search(0)}
            />
            <Input
              accessibilityLabel="City or ZIP code"
              placeholder="City or ZIP code"
              value={location}
              onChangeText={setLocation}
            />
            <Button label="Find events" onPress={() => search(0)} />
            {error && (
              <State
                kind="error"
                message={error}
                onRetry={() => search(page)}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <State
              kind="empty"
              message="Search by artist, team, venue, city, or date."
            />
          ) : (
            <State kind="loading" message="Searching official event sources…" />
          )
        }
        ListFooterComponent={
          events.length && more ? (
            <Button
              variant="secondary"
              label={loading ? "Loading…" : "Load more"}
              disabled={loading}
              onPress={() => search(page + 1)}
            />
          ) : null
        }
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 120 },
  form: { gap: space.md, marginBottom: space.xl },
});
