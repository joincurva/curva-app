import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { approximateCity, deviceCity } from "../../lib/location";
import { EventCard } from "../../components/event-card";
import { Button, Input, Screen, State, Title, Body } from "../../components/ui";
import { getEvents, getPerformer, performerSlug } from "../../lib/api";
import { router } from "expo-router";
import type { Event } from "../../lib/types";
import { colors, radius, space } from "../../lib/theme";
export default function Discover() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artist, setArtist] = useState<{ name: string; slug: string; count: number }>();
  const search = useCallback(
    async (next = 0, where?: string) => {
      setLoading(true);
      setError("");
      try {
        const place = where ?? location;
        const p = new URLSearchParams({
          q,
          location: place,
          ...(place ? {} : { country: "US" }),
          page: String(next),
        });
        if (!next) {
          setArtist(undefined);
          const slug = performerSlug(q.trim());
          if (slug.length >= 2) void getPerformer(slug).then((a) => setArtist({ name: a.name, slug: a.slug, count: a.dates.length })).catch(() => undefined);
        }
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
  // Open on what's happening near the fan.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void approximateCity().then((city) => {
      if (city) setLocation(city);
      void search(0, city);
    });
  }, [search]);
  const nearMe = async () => {
    setLoading(true);
    const r = await deviceCity().catch(() => ({ city: undefined, denied: false }));
    setLoading(false);
    if (r.denied && !r.city) Alert.alert("Location is off", "Turn on location for Curva in Settings, or type a city or ZIP code.");
    if (r.city) {
      setLocation(r.city);
      void search(0, r.city);
    }
  };
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
              Concerts, games and shows from official listings{location ? ` near ${location}` : ""}.
            </Body>
            <Input
              accessibilityLabel="Artist, team, venue, or event"
              placeholder="Artist, team, venue, or event"
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              onSubmitEditing={() => search(0)}
            />
            <View style={s.whereRow}>
              <View style={{ flex: 1 }}>
                <Input
                  accessibilityLabel="City or ZIP code"
                  placeholder="City or ZIP code"
                  value={location}
                  onChangeText={setLocation}
                  returnKeyType="search"
                  onSubmitEditing={() => search(0)}
                />
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Use my location" onPress={() => void nearMe()} style={s.nearBtn}>
                <Ionicons name="navigate" size={18} color={colors.cobalt} />
                <Text style={s.nearText}>Near me</Text>
              </Pressable>
            </View>
            <Button label="Find events" onPress={() => search(0)} />
            {artist ? (
              <Pressable accessibilityRole="button" onPress={() => router.push(`/presales/${artist.slug}`)} style={s.artist}>
                <Ionicons name="person-circle" size={34} color={colors.cobalt} />
                <View style={{ flex: 1 }}>
                  <Text style={s.artistName}>{artist.name}</Text>
                  <Text style={s.artistMeta}>{artist.count} upcoming dates · Follow and see every sale</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
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
  artist: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: space.md },
  artistName: { fontSize: 17, fontWeight: "800", color: colors.ink },
  artistMeta: { fontSize: 13, color: colors.muted },
  whereRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  nearBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 48, paddingHorizontal: 12, borderRadius: radius.control, backgroundColor: "#E9EDFE" },
  nearText: { color: colors.cobalt, fontWeight: "800" },
  content: { padding: space.lg, paddingBottom: 120 },
  form: { gap: space.md, marginBottom: space.xl },
});
