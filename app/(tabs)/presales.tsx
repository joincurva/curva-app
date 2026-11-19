import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Body, Button, Input, Screen, State, Title } from "../../components/ui";
import { getPresales, saveSaleReminder } from "../../lib/api";
import { turnOnSaleAlerts } from "../../lib/push";
import { useSession } from "../../lib/session";
import { brand, colors, radius, space } from "../../lib/theme";
import type { PresaleDate, PresaleWindow } from "../../lib/types";

function dayLabel(iso: string, timeZone: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
}

function showDate(date: string) {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function openOfficial(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return Alert.alert("Official link unavailable", "This listing has no valid official link.");
  }
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "ticketmaster.com" || url.hostname.endsWith(".ticketmaster.com"))
  )
    return Alert.alert("Link blocked", "Curva only opens verified official ticket links.");
  try {
    await Linking.openURL(url.toString());
  } catch {
    Alert.alert("Could not open Ticketmaster", "Check your connection and try again.");
  }
}

function Window({ sale }: { sale: PresaleWindow }) {
  const { session } = useSession();
  const [saved, setSaved] = useState<Record<string, "saving" | "on">>({});
  const remind = async (date: PresaleDate) => {
    if (!session) {
      Alert.alert("Sign in to get reminders", "We'll email you the day before and right before the queue opens.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    setSaved((v) => ({ ...v, [date.id]: "saving" }));
    try {
      await saveSaleReminder(date, session.token);
      setSaved((v) => ({ ...v, [date.id]: "on" }));
      // Ask for notifications at the moment they matter; email reminders work either way.
      void turnOnSaleAlerts(session.token).catch(() => undefined);
    } catch (x) {
      setSaved((v) => {
        const next = { ...v };
        delete next[date.id];
        return next;
      });
      Alert.alert("Reminder not saved", x instanceof Error ? x.message : "Try again in a moment.");
    }
  };
  return (
    <View style={s.card}>
      <View style={s.when}>
        <Text style={s.day}>{dayLabel(sale.start, sale.timeZone)}</Text>
        <Text style={s.time}>{sale.time}</Text>
      </View>
      <Text style={s.title} accessibilityRole="header">
        {sale.title}
      </Text>
      <Text style={[s.badge, sale.kind === "onsale" ? s.onsale : s.presale]}>{sale.label}</Text>
      {sale.dates.map((date) => {
        const state = saved[date.id];
        return (
          <View key={date.id} style={s.date}>
            <View style={s.dateText}>
              <Text style={s.dateLine}>{showDate(date.date)}</Text>
              <Text style={s.venue}>
                {date.venue}, {date.city}
                {date.region ? `, ${date.region}` : ""}
              </Text>
            </View>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remind me about ${date.name} on ${showDate(date.date)}`}
                accessibilityState={{ disabled: state !== undefined, checked: state === "on" }}
                disabled={state !== undefined}
                onPress={() => void remind(date)}
                style={[s.remind, state === "on" && s.remindOn]}
              >
                <Text style={[s.remindText, state === "on" && s.remindTextOn]}>
                  {state === "on" ? "Reminder on" : state === "saving" ? "Saving…" : "Remind me"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Official page for ${date.name}`}
                onPress={() => void openOfficial(date.officialUrl)}
                style={s.official}
              >
                <Text style={s.officialText}>Official page</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function Presales() {
  const [query, setQuery] = useState("");
  const [sales, setSales] = useState<PresaleWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const r = await getPresales(q);
      setSales(r.sales);
    } catch (x) {
      setError(x instanceof Error ? x.message : "The presale calendar could not load.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <Screen>
      <FlatList
        data={sales}
        keyExtractor={(sale) => sale.key}
        renderItem={({ item }) => <Window sale={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading && sales.length > 0} onRefresh={() => void load(query)} />}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.band}>
              <Text style={s.bandTitle}>Presales</Text>
              <Text style={s.bandBody}>
                Every official presale and on-sale in the next 30 days, in the venue&apos;s local time. Buy at face value
                from the official seller.
              </Text>
            </View>
            <Input
              accessibilityLabel="Search artist, team, venue or city"
              placeholder="Artist, team, venue or city"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void load(query)}
              returnKeyType="search"
            />
            <Button label="Search" variant="secondary" onPress={() => void load(query)} disabled={loading} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <State kind="loading" message="Loading official sale times…" />
          ) : error ? (
            <State kind="error" message={error} onRetry={() => void load(query)} />
          ) : (
            <State kind="empty" message="No official sales match that search in the next 30 days." />
          )
        }
        ListFooterComponent={
          sales.length ? (
            <Body muted>
              From Ticketmaster&apos;s official listing. Curva isn&apos;t affiliated with any artist, team, venue or ticket seller.
            </Body>
          ) : null
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { gap: space.md, marginBottom: space.md },
  band: {
    backgroundColor: brand.navy,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
    borderBottomWidth: 4,
    borderBottomColor: brand.gold,
  },
  bandTitle: { color: "white", fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
  bandBody: { color: brand.mist, fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: brand.periwinkle,
    padding: space.lg,
    gap: space.sm,
  },
  when: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  day: { fontSize: 14, fontWeight: "800", color: colors.cobalt },
  time: { fontSize: 14, fontWeight: "700", color: colors.ink },
  title: { fontSize: 19, lineHeight: 24, fontWeight: "800", color: colors.ink },
  badge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  presale: { backgroundColor: "#E9EDFE", color: colors.cobalt },
  onsale: { backgroundColor: "#FFF4D6", color: colors.warning },
  date: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    gap: space.sm,
  },
  dateText: { gap: 2 },
  dateLine: { fontSize: 15, fontWeight: "700", color: colors.ink },
  venue: { fontSize: 14, color: colors.muted },
  actions: { flexDirection: "row", gap: space.sm },
  remind: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: brand.navy,
    justifyContent: "center",
  },
  remindOn: { backgroundColor: brand.gold },
  remindText: { color: "white", fontWeight: "700", fontSize: 14 },
  remindTextOn: { color: brand.navy },
  official: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  officialText: { color: colors.cobalt, fontWeight: "700", fontSize: 14 },
});
