import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TicketHandoff } from "../../components/handoff";
import { SoldOutHelp } from "../../components/sold-out";
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
        ))}
      </View>

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
  category: { color: brand.gold, fontSize: 13, fontWeight: "700" },
  title: { color: "white", fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.5 },
  line: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  lineText: { flex: 1, color: brand.mist, fontSize: 15, lineHeight: 21 },
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
  secondaryText: { color: brand.navy, fontWeight: "700", fontSize: 15 },
  tip: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink },
  foot: { fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: "center" },
});
