import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCompanion, removeMyEvent } from "../../lib/api";
import { subscribeCalendar } from "../../lib/calendar";
import { ShowNotes } from "../../components/show-notes";
import { openOfficialTickets } from "../../lib/official";
import { useSession } from "../../lib/session";
import { brand, colors, radius, space } from "../../lib/theme";
import { countdownLabel, daysUntil, showDate } from "../../lib/time";
import type { Companion, FanEvent } from "../../lib/types";

const PLAN = [
  { icon: "phone-portrait-outline", title: "Tickets ready", text: "Your tickets live in the Ticketmaster app. Open them before you leave and add them to Apple Wallet if offered, in case signal is weak at the venue." },
  { icon: "bag-handle-outline", title: "Bag and entry rules", text: "Check the venue's official website for its bag policy and entry gates. Many stadiums only allow clear bags." },
  { icon: "train-outline", title: "Getting there", text: "Plan your route and your ride home before the day. Transit and rideshare get busy right after the show." },
  { icon: "time-outline", title: "Arrive early", text: "Doors open before the show starts. Security lines are longest in the last 30 minutes." },
] as const;

export default function ShowScreen() {
  const params = useLocalSearchParams<{ id: string; show?: string }>();
  const { session } = useSession();
  const show = useMemo(() => {
    try {
      return params.show ? (JSON.parse(params.show) as FanEvent) : undefined;
    } catch {
      return undefined;
    }
  }, [params.show]);
  const [info, setInfo] = useState<Companion>();
  useEffect(() => {
    if (!show?.provider_event_id || show.provider !== "ticketmaster") return;
    let live = true;
    void getCompanion(show.provider_event_id).then((c) => live && setInfo(c)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [show?.provider_event_id, show?.provider]);
  if (!show)
    return (
      <View style={s.page}>
        <Text style={s.muted}>Open this show again from My Shows.</Text>
      </View>
    );
  const days = daysUntil(show.event_date);
  const share = () =>
    void Share.share({
      message: `I'm going to ${show.event_name}${show.event_date ? ` on ${showDate(show.event_date)}` : ""}${show.venue_name ? ` at ${show.venue_name}` : ""}. Planning it on Curva: https://joincurva.com`,
    }).catch(() => undefined);
  const remove = () =>
    Alert.alert("Remove from My Shows?", show.event_name, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (!session) return;
          void removeMyEvent(show.id, session.token)
            .then(() => router.back())
            .catch(() => Alert.alert("Couldn't remove it", "Try again in a moment."));
        },
      },
    ]);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Share this show" onPress={share} hitSlop={12}>
              <Ionicons name="share-outline" size={24} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      <View style={s.band}>
        <Text style={s.going}>{(days ?? 0) < 0 ? "You were there" : "You're going"}</Text>
        <Text style={s.title} accessibilityRole="header">
          {show.event_name}
        </Text>
        {show.event_date ? (
          <View style={s.line}>
            <Ionicons name="calendar-outline" size={18} color={brand.mist} />
            <Text style={s.lineText}>{showDate(show.event_date)}</Text>
          </View>
        ) : null}
        {show.venue_name ? (
          <View style={s.line}>
            <Ionicons name="location-outline" size={18} color={brand.mist} />
            <Text style={s.lineText}>
              {show.venue_name}
              {show.city ? `, ${show.city}` : ""}
            </Text>
          </View>
        ) : null}
        <Text style={s.count}>{countdownLabel(days)}</Text>
      </View>

      {show.change_kind ? (
        <View style={[s.card, s.change]}>
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <Text style={s.tipText}>
            This show changed{show.previous_event_date ? ` from ${showDate(show.previous_event_date)}` : ""}. Check the official event page for details.
          </Text>
        </View>
      ) : null}

      <View style={s.actions}>
        <Action icon="navigate" label="Directions" onPress={() => void Linking.openURL(info?.directions.apple ?? `https://maps.apple.com/?daddr=${encodeURIComponent([show.venue_name, show.city].filter(Boolean).join(", "))}`)} />
        <Action icon="train" label="Transit" onPress={() => void Linking.openURL(info?.directions.appleTransit ?? `https://maps.apple.com/?daddr=${encodeURIComponent([show.venue_name, show.city].filter(Boolean).join(", "))}&dirflg=r`)} />
        <Action icon="calendar" label="Calendar" onPress={() => session && void subscribeCalendar(session.token)} />
        <Action icon="ticket" label="Event page" onPress={() => void openOfficialTickets(info?.officialUrl ?? show.official_url ?? undefined)} />
      </View>

      {info?.weather ? (
        <View style={[s.card, s.weather]}>
          <Ionicons name="partly-sunny-outline" size={28} color={colors.cobalt} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.tipTitle}>
              {info.weather.label}: {info.weather.temperature}°{info.weather.unit} · {info.weather.summary}
            </Text>
            <Text style={s.small}>
              {info.weather.rainChance != null ? `${info.weather.rainChance}% chance of rain. ` : ""}Forecast from the {info.weather.source}.
            </Text>
          </View>
        </View>
      ) : null}

      {info?.venueGuide ? (
        <View style={s.card}>
          <Text style={s.h2}>{show.venue_name ?? "Venue"} essentials</Text>
          {([
            ["shield-checkmark-outline", "Venue rules", info.venueGuide.rules],
            ["car-outline", "Parking", info.venueGuide.parking],
            ["ticket-outline", "Will call", info.venueGuide.willCall],
            ["time-outline", "Box office", info.venueGuide.boxOfficeHours],
            ["accessibility-outline", "Accessibility", info.venueGuide.accessibility],
            ["people-outline", "Kids", info.venueGuide.childPolicy],
          ] as const).filter(([, , text]) => Boolean(text)).map(([icon, title, text]) => (
            <View key={title} style={s.tip}>
              <Ionicons name={icon} size={22} color={colors.cobalt} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.tipTitle}>{title}</Text>
                <Text style={s.tipText}>{text}</Text>
              </View>
            </View>
          ))}
          <Text style={s.small}>From the venue&apos;s official Ticketmaster listing. Policies can change, so check the venue&apos;s website before you go.</Text>
        </View>
      ) : null}

      <ShowNotes show={show} past={(days ?? 0) < 0} />

      <View style={s.card}>
        <Text style={s.h2}>Show-day plan</Text>
        {PLAN.map((step) => (
          <View key={step.title} style={s.tip}>
            <Ionicons name={step.icon} size={22} color={colors.cobalt} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.tipTitle}>{step.title}</Text>
              <Text style={s.tipText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={remove} style={s.remove}>
        <Text style={s.removeText}>Remove from My Shows</Text>
      </Pressable>
    </ScrollView>
  );
}

function Action({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.action, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={22} color={brand.navy} />
      <Text style={s.actionText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", gap: space.sm },
  action: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 12, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionText: { fontFamily: "Manrope-ExtraBold", fontSize: 12, fontWeight: "800", color: brand.navy },
  weather: { flexDirection: "row", alignItems: "center" },
  small: { fontFamily: "Manrope-Regular", fontSize: 12, lineHeight: 17, color: colors.muted },
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm, borderBottomWidth: 4, borderBottomColor: brand.gold },
  going: { fontFamily: "Manrope-ExtraBold", color: brand.gold, fontSize: 13, fontWeight: "800" },
  title: { fontFamily: "Manrope-ExtraBold", color: "white", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.5 },
  line: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  lineText: { fontFamily: "Manrope-Regular", flex: 1, color: brand.mist, fontSize: 15, lineHeight: 21 },
  count: { fontFamily: "Manrope-ExtraBold", color: brand.gold, fontSize: 20, fontWeight: "800", marginTop: space.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  change: { flexDirection: "row", alignItems: "flex-start" },
  h2: { fontFamily: "Manrope-ExtraBold", fontSize: 19, fontWeight: "800", color: colors.ink },
  tip: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  tipTitle: { fontFamily: "Manrope-Bold", fontSize: 15, fontWeight: "700", color: colors.ink },
  tipText: { fontFamily: "Manrope-Regular", flex: 1, fontSize: 15, lineHeight: 21, color: colors.muted },
  muted: { padding: space.lg, color: colors.muted },
  remove: { alignItems: "center", paddingVertical: space.md },
  removeText: { color: colors.muted, fontWeight: "700" },
});
