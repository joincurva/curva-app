import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { brand, colors, radius, space } from "../lib/theme";

/** One clear path for a fan who got shut out: official options only, never a reseller markup. */
export function SoldOutHelp({ eventId, eventName, venue, city }: { eventId?: string; eventName: string; venue?: string; city?: string }) {
  const steps = [
    {
      icon: "notifications-outline",
      title: "Set a Ticket Alert",
      text: "Curva watches the official listing and tells you when tickets are released or returned.",
      onPress: () => router.push({ pathname: "/(tabs)/alerts", params: { eventId: eventId ?? "", eventName, venue: venue ?? "", city: city ?? "" } }),
    },
    {
      icon: "swap-horizontal-outline",
      title: "Check official face-value resale",
      text: "Some tours use Ticketmaster's Face Value Exchange, where fans resell at the price they paid.",
      onPress: () => void WebBrowser.openBrowserAsync("https://joincurva.com/guides/tickets/face-value-exchange", { controlsColor: brand.navy, dismissButtonStyle: "done" }),
    },
    {
      icon: "warning-outline",
      title: "Skip DMs and too-good deals",
      text: "Never pay through links in comments or messages. Listings far above face value usually mean a reseller.",
    },
  ] as const;
  return (
    <View style={s.card}>
      <Text style={s.h2}>Sold out? Here&apos;s what to do</Text>
      {steps.map((step) => {
        const body = (
          <>
            <Ionicons name={step.icon} size={22} color={colors.cobalt} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.title}>{step.title}</Text>
              <Text style={s.text}>{step.text}</Text>
            </View>
            {"onPress" in step ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
          </>
        );
        return "onPress" in step ? (
          <Pressable key={step.title} accessibilityRole="button" onPress={step.onPress} style={s.row}>{body}</Pressable>
        ) : (
          <View key={step.title} style={s.row}>{body}</View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  h2: { fontFamily: "Manrope-ExtraBold", fontSize: 19, fontWeight: "800", color: colors.ink },
  row: { flexDirection: "row", gap: space.md, alignItems: "center" },
  title: { fontFamily: "Manrope-Bold", fontSize: 15, fontWeight: "700", color: colors.ink },
  text: { fontFamily: "Manrope-Regular", fontSize: 14, lineHeight: 20, color: colors.muted },
});
