import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Body, Button, Card, Heading, Title } from "../../components/ui";
import type { Event } from "../../lib/types";
import { colors, space } from "../../lib/theme";
export default function EventDetail() {
  const params = useLocalSearchParams<{ event?: string }>();
  const event = useMemo(() => {
    try {
      return JSON.parse(params.event ?? "") as Event;
    } catch {
      return undefined;
    }
  }, [params.event]);
  const [opening, setOpening] = useState(false);
  if (!event)
    return (
      <View style={s.page}>
        <Title>Event unavailable</Title>
        <Body muted>Return to Discover and open this event again.</Body>
      </View>
    );
  const getTickets = async () => {
    if (!event.officialUrl)
      return Alert.alert(
        "Official link unavailable",
        "Curva does not have a verified official-provider URL for this event.",
      );
    let url: URL;
    try {
      url = new URL(event.officialUrl);
    } catch {
      return Alert.alert(
        "Official link unavailable",
        "The official-provider URL for this event is invalid.",
      );
    }
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === "ticketmaster.com" ||
        url.hostname.endsWith(".ticketmaster.com")
      )
    )
      return Alert.alert(
        "Link blocked",
        "Curva only opens verified official ticket-provider links.",
      );
    setOpening(true);
    try {
      await Linking.openURL(url.toString());
    } catch {
      Alert.alert(
        "Could not open Ticketmaster",
        "Check your connection and try again.",
      );
    } finally {
      setOpening(false);
    }
  };
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {event.imageUrl && (
        <Image
          source={{ uri: event.imageUrl }}
          alt={event.imageAlt ?? "Event artwork"}
          accessibilityLabel={event.imageAlt ?? "Event artwork"}
          style={s.image}
        />
      )}
      <Title>{event.name}</Title>
      <Body>
        {new Date(`${event.date}T${event.time ?? "12:00:00"}`).toLocaleString(
          undefined,
          { dateStyle: "full", timeStyle: event.time ? "short" : undefined },
        )}
      </Body>
      <Heading>{event.venue}</Heading>
      <Body muted>
        {event.city}
        {event.region ? `, ${event.region}` : ""} · {event.category}
      </Body>
      <Card>
        <Heading>Official tickets</Heading>
        <Body muted>
          Curva does not sell tickets. Availability and final prices are
          confirmed by the official provider.
        </Body>
        <Button
          label={
            opening
              ? "Opening Ticketmaster…"
              : event.officialUrl
                ? "Get tickets from Ticketmaster"
                : "Official link unavailable"
          }
          disabled={opening || !event.officialUrl}
          onPress={getTickets}
        />
      </Card>
      <Button
        variant="secondary"
        label="Create a Ticket Alert"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/alerts",
            params: {
              eventId: event.id,
              eventName: event.name,
              venue: event.venue,
              city: event.city,
            },
          })
        }
      />
      <Button
        variant="secondary"
        label="Ask Curva about this"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/ask",
            params: { eventId: event.id, eventName: event.name },
          })
        }
      />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
});
