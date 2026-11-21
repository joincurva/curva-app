import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EventCard } from "../../components/event-card";
import { Body, Button, Heading, Screen, State } from "../../components/ui";
import { getEvents, getMyEvents, getMySales, getPresales } from "../../lib/api";
import { useFollows } from "../../lib/follows";
import { approximateCity } from "../../lib/location";
import { buildRecap } from "../../lib/recap";
import { countdownLabel, daysUntil, showDate } from "../../lib/time";
import { useSession } from "../../lib/session";
import { brand, colors, radius, space } from "../../lib/theme";
import { GOING_STATES, type Event, type FanEvent, type MySale, type PresaleWindow } from "../../lib/types";

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
  const { session, ready } = useSession();
  // Only the newest load may update the screen, so a slower signed-out load can't wipe a fan's shows.
  const loadId = useRef(0);
  const [mine, setMine] = useState<MySale[]>([]);
  const [shows, setShows] = useState<FanEvent[]>([]);
  const [pastCount, setPastCount] = useState(0);
  const { follows } = useFollows();
  const [near, setNear] = useState("");
  const [watching, setWatching] = useState(0);
  const [soon, setSoon] = useState<PresaleWindow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const id = ++loadId.current;
    const current = () => id === loadId.current;
    setLoading(true);
    setError("");
    try {
      const [p, e, m, f] = await Promise.all([
        getPresales(),
        approximateCity().then((city) => {
          setNear(city);
          return getEvents(new URLSearchParams(city ? { location: city, page: "0" } : { country: "US", page: "0" }));
        }).catch(() => ({ events: [] })), // "Near you" can be empty; it shouldn't hide the fan's own shows and sales.
        session ? getMySales(session.token).catch(() => ({ watching: 0, sales: [] })) : Promise.resolve({ watching: 0, sales: [] }),
        session ? getMyEvents(session.token).catch(() => ({ events: [] as FanEvent[] })) : Promise.resolve({ events: [] as FanEvent[] }),
      ]);
      if (!current()) return;
      {
        const t = new Date();
        const todayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
        setPastCount(buildRecap(f.events, t.getFullYear(), todayIso).count);
      }
      setShows(
        f.events
          .filter((x) => (GOING_STATES as readonly string[]).includes(x.lifecycle_state) && (daysUntil(x.event_date) ?? 0) >= 0)
          .sort((a, b) => String(a.event_date ?? "9999").localeCompare(String(b.event_date ?? "9999"))),
      );
      setSoon(p.sales.slice(0, 5));
      setEvents(e.events.slice(0, 6));
      setMine(m.sales);
      setWatching(m.watching);
    } catch (x) {
      if (current()) setError(x instanceof Error ? x.message : "Curva could not refresh.");
    } finally {
      if (current()) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load, ready]);
  const toPresales = () => router.push("/(tabs)/presales");
  return (
    <Screen>
      <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading && soon.length > 0} onRefresh={() => void load()} />}>
        <View style={s.band}>
          <Text style={s.brand}>curva</Text>
          <Text style={s.headline}>Your live-event life, in one place.</Text>
          <Text style={s.sub}>Follow who you love once. Curva gets you to every presale on time, sends you to the official seller at face value, then helps you plan the night.</Text>
          {!session ? (
            <Pressable accessibilityRole="button" onPress={() => router.push("/auth")} style={s.cta}>
              <Text style={s.ctaText}>Sign in to get reminders</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? <State kind="error" message={error} onRetry={() => void load()} /> : null}

        {session && !follows.length ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/welcome")} style={s.followCard}>
            <Text style={s.followTitle}>Follow who you love</Text>
            <Text style={s.followSub}>One tap per artist, team or show and Curva covers every presale and on-sale.</Text>
          </Pressable>
        ) : null}

        {session && pastCount ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/recap")} style={s.recapCard}>
            <Text style={s.recapTitle}>Your {new Date().getFullYear()} in live events</Text>
            <Text style={s.recapSub}>{pastCount} show{pastCount === 1 ? "" : "s"} so far. Add memories and share your year.</Text>
          </Pressable>
        ) : null}

        {session && shows.length ? (
          <View style={s.section}>
            <Heading>My shows</Heading>
            <View style={s.card}>
              {shows.map((show) => (
                <SaleRow
                  key={show.id}
                  title={show.event_name}
                  label={countdownLabel(daysUntil(show.event_date))}
                  when={[show.event_date ? showDate(show.event_date) : "", show.venue_name ?? ""].filter(Boolean).join(" · ")}
                  onPress={() => router.push({ pathname: "/show/[id]", params: { id: show.id, show: JSON.stringify(show) } })}
                />
              ))}
            </View>
          </View>
        ) : null}

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
            <Heading>{near ? `Happening near ${near.split(",")[0]}` : "Happening soon"}</Heading>
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
  recapCard: { backgroundColor: "#0B1633", borderRadius: 16, padding: 18, gap: 4, borderBottomWidth: 4, borderBottomColor: "#FFD873" },
  recapTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  recapSub: { color: "#C9D3FF", fontSize: 15, lineHeight: 21 },
  followCard: { backgroundColor: "#FFD873", borderRadius: 16, padding: 18, gap: 4 },
  followTitle: { color: "#0B1633", fontSize: 18, fontWeight: "800" },
  followSub: { color: "#0B1633", fontSize: 15, lineHeight: 21 },
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
