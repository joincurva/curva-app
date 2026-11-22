import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Body, Button, Input, Screen, State, Title } from "../../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { getPresales } from "../../lib/api";
import { useReminders } from "../../lib/remind";
import { countdown, dayLabel, showDate, useNow } from "../../lib/time";
import { brand, colors, radius, space } from "../../lib/theme";
import type { PresaleWindow } from "../../lib/types";

function openSale(sale: PresaleWindow) {
  router.push({ pathname: "/sale/[key]", params: { key: sale.key, title: sale.title, sale: JSON.stringify(sale) } });
}

function Window({ sale }: { sale: PresaleWindow }) {
  const { saved, remind } = useReminders();
  const now = useNow(sale.start);
  return (
    <View style={s.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${sale.title}, ${sale.label}. Open sale details`}
        onPress={() => openSale(sale)}
        style={({ pressed }) => [s.head, pressed && { opacity: 0.7 }]}
      >
        <View style={s.when}>
          <Text style={s.day}>{dayLabel(sale.start, sale.timeZone)}</Text>
          <Text style={s.time}>{sale.time}</Text>
        </View>
        <View style={s.titleRow}>
          <Text style={s.title} accessibilityRole="header">
            {sale.title}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
        <View style={s.metaRow}>
          <Text style={[s.badge, sale.kind === "onsale" ? s.onsale : s.presale]}>{sale.label}</Text>
          <Text style={s.count}>{countdown(sale.start, now)}</Text>
        </View>
      </Pressable>
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
                <Ionicons
                  name={state === "on" ? "notifications" : "notifications-outline"}
                  size={16}
                  color={state === "on" ? brand.navy : "white"}
                />
                <Text style={[s.remindText, state === "on" && s.remindTextOn]}>
                  {state === "on" ? "Reminder on" : state === "saving" ? "Saving…" : "Remind me"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Sale details for ${date.name}`}
                onPress={() => openSale(sale)}
                style={s.official}
              >
                <Text style={s.officialText}>Details</Text>
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
  bandTitle: { fontFamily: "Manrope-ExtraBold", color: "white", fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
  bandBody: { fontFamily: "Manrope-Regular", color: brand.mist, fontSize: 15, lineHeight: 22 },
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
  head: { gap: space.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  count: { fontFamily: "Manrope-Bold", fontSize: 13, fontWeight: "700", color: colors.muted, fontVariant: ["tabular-nums"] },
  when: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  day: { fontFamily: "Manrope-ExtraBold", fontSize: 14, fontWeight: "800", color: colors.cobalt },
  time: { fontFamily: "Manrope-Bold", fontSize: 14, fontWeight: "700", color: colors.ink },
  title: { fontFamily: "Manrope-ExtraBold", flex: 1, fontSize: 19, lineHeight: 24, fontWeight: "800", color: colors.ink },
  badge: {
    fontFamily: "Manrope-Bold", alignSelf: "flex-start",
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
  dateLine: { fontFamily: "Manrope-Bold", fontSize: 15, fontWeight: "700", color: colors.ink },
  venue: { fontFamily: "Manrope-Regular", fontSize: 14, color: colors.muted },
  actions: { flexDirection: "row", gap: space.sm },
  remind: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    backgroundColor: brand.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  remindOn: { backgroundColor: brand.gold },
  remindText: { fontFamily: "Manrope-Bold", color: "white", fontWeight: "700", fontSize: 14 },
  remindTextOn: { color: brand.navy },
  official: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  officialText: { fontFamily: "Manrope-Bold", color: colors.cobalt, fontWeight: "700", fontSize: 14 },
});
