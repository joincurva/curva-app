import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { Event } from "../lib/types";
import { colors, radius, space } from "../lib/theme";
export function EventCard({
  event,
}: {
  event: Event;
}) {
  const date = new Date(`${event.date}T${event.time ?? "12:00:00"}`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${date.toLocaleDateString()}, ${event.venue}`}
      onPress={() =>
        router.push({
          pathname: "/event/[id]",
          params: { id: event.id, event: JSON.stringify(event) },
        })
      }
      style={s.card}
    >
      {event.imageUrl ? (
        <Image
          source={{ uri: event.imageUrl }}
          alt={event.imageAlt ?? `${event.name} artwork`}
          accessibilityLabel={event.imageAlt ?? `${event.name} artwork`}
          style={s.image}
        />
      ) : (
        <View style={[s.image, s.fallback]} />
      )}
      <View style={s.content}>
        <Text style={s.date}>
          {date
            .toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
            .toUpperCase()}
        </Text>
        <Text allowFontScaling style={s.name}>
          {event.name}
        </Text>
        <Text allowFontScaling style={s.meta}>
          {event.venue} · {event.city}
          {event.region ? `, ${event.region}` : ""}
        </Text>
        <Text style={s.source}>Official source: Ticketmaster</Text>
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    minWidth: 260,
  },
  image: { height: 145, width: "100%", backgroundColor: "#D8D1C5" },
  fallback: { backgroundColor: "#DDE4FA" },
  content: { padding: space.lg, gap: space.xs },
  date: { fontSize: 12, fontWeight: "800", color: colors.cobalt },
  name: { fontSize: 18, lineHeight: 23, fontWeight: "800", color: colors.ink },
  meta: { fontSize: 14, lineHeight: 20, color: colors.muted },
  source: { fontSize: 12, color: colors.muted, marginTop: space.xs },
});
