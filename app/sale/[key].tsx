import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TicketHandoff } from "../../components/handoff";
import { State } from "../../components/ui";
import { getPresales } from "../../lib/api";
import { openOfficialTickets } from "../../lib/official";
import { buyThenAsk } from "../../lib/got-tickets";
import { useSession } from "../../lib/session";
import { useReminders } from "../../lib/remind";
import { brand, colors, radius, space } from "../../lib/theme";
import { countdown, dayLabel, showDate, useNow } from "../../lib/time";
import type { PresaleDate, PresaleWindow } from "../../lib/types";

const BEFORE = [
  { icon: "person-circle-outline", text: "Sign in to your Ticketmaster account and check your card is saved before the queue opens." },
  { icon: "key-outline", text: "Presale codes only come from official sources: the artist, team, venue or your card issuer. Never buy a code." },
  { icon: "phone-portrait-outline", text: "Join from one device. Extra tabs can move you to the back of the queue." },
  { icon: "pricetag-outline", text: "Buy at face value from the official seller. Prices well above face value usually mean a reseller." },
] as const;

export default function SaleScreen() {
  const params = useLocalSearchParams<{ key: string; sale?: string; title?: string }>();
  const initial = useMemo(() => {
    try {
      return params.sale ? (JSON.parse(params.sale) as PresaleWindow) : undefined;
    } catch {
      return undefined;
    }
  }, [params.sale]);
  const [sale, setSale] = useState<PresaleWindow | undefined>(initial);
  const [error, setError] = useState("");
  const now = useNow(sale?.start);
  const { saved, remind } = useReminders();
  const { session } = useSession();

  useEffect(() => {
    if (sale || !params.title) return;
    let live = true;
    getPresales(params.title)
      .then((r) => {
        if (!live) return;
        const found = r.sales.find((x) => x.key === params.key) ?? r.sales[0];
        if (found) setSale(found);
        else setError("This sale isn't on the official calendar anymore.");
      })
      .catch((x) => live && setError(x instanceof Error ? x.message : "This sale could not load."));
    return () => {
      live = false;
    };
  }, [sale, params.key, params.title]);

  if (!sale)
    return (
      <View style={s.page}>
        <Stack.Screen options={{ title: params.title ?? "Sale" }} />
        {error ? <State kind="error" message={error} /> : <State kind="loading" message="Loading official sale times…" />}
      </View>
    );

  const open = new Date(sale.start).getTime() <= now;
  const share = () =>
    void Share.share({
      message: `${sale.title}: ${sale.label}, ${dayLabel(sale.start, sale.timeZone)} at ${sale.time}. I'm using Curva to get a reminder before the queue opens. https://joincurva.com/presales`,
    }).catch(() => undefined);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Share this sale" onPress={share} hitSlop={12}>
              <Ionicons name="share-outline" size={24} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <View style={s.band}>
        <Text style={[s.badge, sale.kind === "onsale" ? s.onsale : s.presale]}>{sale.label}</Text>
        <Text style={s.title} accessibilityRole="header">
          {sale.title}
        </Text>
        <Text style={s.when}>
          {dayLabel(sale.start, sale.timeZone)} · {sale.time}
        </Text>
        <View style={s.clock} accessibilityLiveRegion="polite">
          <Ionicons name={open ? "flash" : "time-outline"} size={18} color={brand.gold} />
          <Text style={s.clockText}>{countdown(sale.start, now)}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Dates in this sale</Text>
        <Text style={s.muted}>Tap Remind me and Curva nudges you the day before and right before the queue opens.</Text>
        {sale.dates.map((date: PresaleDate) => {
          const state = saved[date.id];
          return (
            <View key={date.id} style={s.date}>
              <Text style={s.dateLine}>{showDate(date.date)}</Text>
              <Text style={s.venue}>
                {date.venue}, {date.city}
                {date.region ? `, ${date.region}` : ""}
              </Text>
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
                  <Text style={[s.remindText, state === "on" && { color: brand.navy }]}>
                    {state === "on" ? "Reminder on" : state === "saving" ? "Saving…" : "Remind me"}
                  </Text>
                </Pressable>
              </View>
              {open ? (
                <TicketHandoff label="Get tickets at face value" onPress={() => void buyThenAsk({ id: date.id, name: date.name, date: date.date, venue: date.venue, city: date.city, officialUrl: date.officialUrl }, session?.token)} />
              ) : (
                <Pressable
                  accessibilityRole="link"
                  accessibilityHint="Opens the official page inside Curva"
                  onPress={() => void openOfficialTickets(date.officialUrl)}
                  style={s.preview}
                >
                  <Text style={s.previewText}>Preview the official page</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Before the queue opens</Text>
        {BEFORE.map((tip) => (
          <View key={tip.text} style={s.tip}>
            <Ionicons name={tip.icon} size={20} color={colors.cobalt} />
            <Text style={s.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>

      <Text style={s.foot}>
        Times are the venue&apos;s local time, from Ticketmaster&apos;s official listing. Curva doesn&apos;t sell tickets and
        isn&apos;t affiliated with any artist, team, venue or ticket seller.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  band: {
    backgroundColor: brand.navy,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.sm,
    borderBottomWidth: 4,
    borderBottomColor: brand.gold,
  },
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
  title: { color: "white", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.5 },
  when: { color: brand.mist, fontSize: 16, fontWeight: "600" },
  clock: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs },
  clockText: { color: brand.gold, fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  h2: { fontSize: 19, fontWeight: "800", color: colors.ink },
  muted: { fontSize: 14, lineHeight: 20, color: colors.muted },
  date: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, gap: space.sm },
  dateLine: { fontSize: 16, fontWeight: "700", color: colors.ink },
  venue: { fontSize: 14, color: colors.muted },
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
  remindText: { color: "white", fontWeight: "700", fontSize: 14 },
  preview: { minHeight: 40, justifyContent: "center" },
  previewText: { color: colors.cobalt, fontWeight: "700", fontSize: 14 },
  tip: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink },
  foot: { fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: "center" },
});
