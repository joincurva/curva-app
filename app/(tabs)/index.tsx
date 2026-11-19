import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EventCard } from "../../components/event-card";
import { Body, Button, Heading, Screen, State } from "../../components/ui";
import { getEvents, getMySales, getPresales } from "../../lib/api";
import { useSession } from "../../lib/session";
import { brand, colors, radius, space } from "../../lib/theme";
import type { Event, MySale, PresaleWindow } from "../../lib/types";

function day(iso: string, timeZone: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone });
}

function SaleRow({ title, label, when, onPress }: { title: string; label: string; when: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${label}, ${when}`} onPress={onPress} style={s.row}>
      <View style={s.rowText}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={s.rowLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={s.rowWhen}>{when}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Home() {
  const { session } = useSession();
  const [mine, setMine] = useState<MySale[]>([]);
  const [watching, setWatching] = useState(0);
  const [soon, setSoon] = useState<PresaleWindow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, e, m] = await Promise.all([
        getPresales(),
        getEvents(new URLSearchParams({ country: "US", page: "0" })),
        session ? getMySales(session.token).catch(() => ({ watching: 0, sales: [] })) : Promise.resolve({ watching: 0, sales: [] }),
      ]);
      setSoon(p.sales.slice(0, 5));
      setEvents(e.events.slice(0, 6));
      setMine(m.sales);
      setWatching(m.watching);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Curva could not refresh.");
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const toPresales = () => router.push("/(tabs)/presales");
  return (
    <Screen>
      <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading && soon.length > 0} onRefresh={() => void load()} />}>
        <View style={s.band}>
          <Text style={s.brand}>curva</Text>
          <Text style={s.headline}>Your live-event life, in one place.</Text>
          <Text style={s.sub}>Every official presale and on-sale, reminders before the queue opens, and tickets at face value from the official seller.</Text>
          {!session ? (
            <Pressable accessibilityRole="button" onPress={() => router.push("/auth")} style={s.cta}>
              <Text style={s.ctaText}>Sign in to get reminders</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? <State kind="error" message={error} onRetry={() => void load()} /> : null}

        {session ? (
          <View style={s.section}>
            <Heading>Your next sales</Heading>
            {mine.length ? (
              <View style={s.card}>
                {mine.map((sale) => (
                  <SaleRow key={sale.key} title={sale.title} label={sale.label} when={`${day(sale.start, sale.timeZone)} · ${sale.time}`} onPress={() => router.push({ pathname: "/sale/[key]", params: { key: sale.key, title: sale.title } })} />
                ))}
              </View>
            ) : (
              <View style={s.card}>
                <Body muted>
                  {watching
                    ? "Nothing you're watching has a sale in the next 30 days. We'll remind you as soon as one is announced."
                    : "Tap Remind me on any sale and it shows up here, with an email the day before and right before the queue opens."}
                </Body>
                <Button label="Find a presale" variant="secondary" onPress={toPresales} />
              </View>
            )}
          </View>
        ) : null}

        <View style={s.section}>
          <Heading>Opening soon</Heading>
          {loading && !soon.length ? <State kind="loading" message="Checking official sale times…" /> : null}
          {soon.length ? (
            <View style={s.card}>
              {soon.map((sale) => (
                <SaleRow key={sale.key} title={sale.title} label={sale.label} when={`${day(sale.start, sale.timeZone)} · ${sale.time}`} onPress={() => router.push({ pathname: "/sale/[key]", params: { key: sale.key, title: sale.title, sale: JSON.stringify(sale) } })} />
              ))}
              <Pressable accessibilityRole="link" onPress={toPresales} style={s.more}>
                <Text style={s.moreText}>See every presale</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {events.length ? (
          <View style={s.section}>
            <Heading>Happening soon</Heading>
            {events.map((event) => (
              <View key={event.id} style={{ marginBottom: space.md }}>
                <EventCard event={event} />
              </View>
            ))}
          </View>
        ) : null}

        <Text style={s.foot}>Curva isn&apos;t affiliated with any artist, team, venue or ticket seller.</Text>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 120, gap: space.xl },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm, borderBottomWidth: 4, borderBottomColor: brand.gold },
  brand: { color: "white", fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
  headline: { color: "white", fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  sub: { color: brand.mist, fontSize: 15, lineHeight: 22 },
  cta: { marginTop: space.sm, alignSelf: "flex-start", backgroundColor: brand.gold, borderRadius: radius.control, paddingHorizontal: 18, minHeight: 48, justifyContent: "center" },
  ctaText: { color: brand.navy, fontWeight: "800", fontSize: 16 },
  section: { gap: space.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, borderTopColor: brand.periwinkle, padding: space.lg, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: space.sm },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  rowLabel: { fontSize: 13, color: colors.muted },
  rowWhen: { fontSize: 13, fontWeight: "700", color: colors.cobalt, textAlign: "right", maxWidth: 140 },
  more: { minHeight: 44, justifyContent: "center" },
  moreText: { color: colors.cobalt, fontWeight: "700", fontSize: 15 },
  foot: { fontSize: 12, color: colors.muted, textAlign: "center" },
});
