import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TicketHandoff } from "../../components/handoff";
import { SoldOutHelp } from "../../components/sold-out";
import { FollowButton } from "../../components/follow-button";
import { performerSlug } from "../../lib/api";
import { Body, Title } from "../../components/ui";
import { officialTicketUrl } from "../../lib/official";
import { buyThenAsk } from "../../lib/got-tickets";
import { useSession } from "../../lib/session";
import type { Event } from "../../lib/types";
import { brand, colors, radius, space } from "../../lib/theme";


export default function EventDetail() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ event?: string }>();
  const event = useMemo(() => {
    try {
      return JSON.parse(params.event ?? "") as Event;
    } catch {
      return undefined;
    }
  }, [params.event]);
  if (!event)
    return (
      <View style={s.page}>
        <Title>Event unavailable</Title>
        <Body muted>Go back to Discover and open this event again.</Body>
      </View>
    );
  const when = new Date(`${event.date}T${event.time ?? "12:00:00"}`).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(event.time ? { hour: "numeric", minute: "2-digit" } : {}),
  });
  const verified = Boolean(officialTicketUrl(event.officialUrl));
  // Who's playing, so a fan can follow them from any event (add-ons like parking aren't performers).
  const performers = [...new Set(event.providerAttractionNames ?? [])].filter((name) => !/parking|tour|suite|add-?on|pre[- ]?game|hospitality|experience/i.test(name)).slice(0, 2);
  const followKind = /sport/i.test(event.category) ? "team" : /theat/i.test(event.category) ? "show" : "artist";
  const share = () =>
    void Share.share({
      message: `${event.name} · ${when} · ${event.venue}, ${event.city}. Found it on Curva: https://joincurva.com`,
    }).catch(() => undefined);
  const alert = () =>
    router.push({
      pathname: "/(tabs)/alerts",
      params: { eventId: event.id, eventName: event.name, venue: event.venue, city: event.city },
    });
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Share this event" onPress={share} hitSlop={12}>
              <Ionicons name="share-outline" size={24} color={colors.ink} />
            </Pressable>
          ),
        }}
      />
      {event.imageUrl ? (
        <Image
          source={{ uri: event.imageUrl }}
          accessibilityLabel={event.imageAlt ?? "Event artwork"}
          style={s.image}
        />
      ) : null}
      <View style={s.band}>
        <Text style={s.category}>{event.category}</Text>
        <Text style={s.title} accessibilityRole="header">
          {event.name}
        </Text>
        <View style={s.line}>
          <Ionicons name="calendar-outline" size={18} color={brand.mist} />
          <Text style={s.lineText}>{when}</Text>
        </View>
        <View style={s.line}>
          <Ionicons name="location-outline" size={18} color={brand.mist} />
          <Text style={s.lineText}>
            {event.venue}, {event.city}
            {event.region ? `, ${event.region}` : ""}
          </Text>
        </View>
      </View>

      {performers.map((name) => (
        <View key={name} style={s.performer}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${name}: every date and sale`} onPress={() => router.push({ pathname: "/presales/[performer]", params: { performer: performerSlug(name), name, kind: followKind } })} style={s.performerMain}>
            <Text style={s.performerName} numberOfLines={2}>{name}</Text>
            <Text style={s.performerMeta}>Every date and sale</Text>
          </Pressable>
          <FollowButton compact kind={followKind} name={name} />
        </View>
      ))}

      <View style={s.card}>
        <Text style={s.h2}>Tickets</Text>
        {verified ? (
          <TicketHandoff label="Get tickets at face value" onPress={() => void buyThenAsk({ id: event.id, name: event.name, date: event.date, venue: event.venue, city: event.city, officialUrl: event.officialUrl }, session?.token)} />
        ) : (
          <Text style={s.muted}>
            Curva doesn&apos;t have a verified official page for this event yet. Set a Ticket Alert and we&apos;ll tell you
            when it&apos;s on sale.
          </Text>
        )}
        <Pressable accessibilityRole="button" onPress={alert} style={({ pressed }) => [s.secondary, pressed && { opacity: 0.7 }]}>
          <Ionicons name="notifications-outline" size={18} color={brand.navy} />
          <Text style={s.secondaryText}>Create a Ticket Alert</Text>
        </Pressable>
      </View>

      <SoldOutHelp eventId={event.id} eventName={event.name} venue={event.venue} city={event.city} />

      <Text style={s.foot}>
        Event details from Ticketmaster&apos;s official listing. Curva doesn&apos;t sell tickets and isn&apos;t affiliated with
        any artist, team, venue or ticket seller.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  image: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.card, backgroundColor: colors.border },
  band: {
    backgroundColor: brand.navy,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.sm,
    borderBottomWidth: 4,
    borderBottomColor: brand.gold,
  },
  category: { fontFamily: "Manrope-Bold", color: brand.gold, fontSize: 13, fontWeight: "700" },
  title: { fontFamily: "Manrope-ExtraBold", color: "white", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.5 },
  line: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  lineText: { fontFamily: "Manrope-Regular", flex: 1, color: brand.mist, fontSize: 15, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  h2: { fontFamily: "Manrope-ExtraBold", fontSize: 19, fontWeight: "800", color: colors.ink },
  muted: { fontFamily: "Manrope-Regular", fontSize: 14, lineHeight: 20, color: colors.muted },
  secondary: {
    minHeight: 48,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  secondaryText: { fontFamily: "Manrope-Bold", color: brand.navy, fontWeight: "700", fontSize: 15 },
  tip: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  tipText: { fontFamily: "Manrope-Regular", flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink },
  foot: { fontFamily: "Manrope-Regular", fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: "center" },
  performer: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: space.lg },
  performerMain: { flex: 1, gap: 2 },
  performerName: { fontFamily: "Manrope-ExtraBold", color: colors.ink, fontSize: 17, fontWeight: "800" },
  performerMeta: { fontFamily: "Manrope-SemiBold", color: colors.cobalt, fontSize: 14, fontWeight: "600" },
});
