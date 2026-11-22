import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { brand, colors, radius, space } from "../lib/theme";

const TILES = [
  { section: "teams", label: "Teams", icon: "people" },
  { section: "broadway", label: "Broadway", icon: "ticket" },
  { section: "championships", label: "Championships", icon: "trophy" },
] as const;

/** Teams, Broadway and championships: the same lists as joincurva.com. */
export function BrowseTiles() {
  return (
    <View style={s.row}>
      {TILES.map((tile) => (
        <Pressable key={tile.section} accessibilityRole="button" accessibilityLabel={`Browse ${tile.label}`} onPress={() => router.push(`/browse/${tile.section}`)} style={({ pressed }) => [s.tile, pressed && { opacity: 0.85 }]}>
          <Ionicons name={tile.icon} size={22} color={brand.gold} />
          <Text style={s.label} numberOfLines={1} adjustsFontSizeToFit>{tile.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", gap: space.sm },
  tile: { flex: 1, backgroundColor: brand.navy, borderRadius: radius.control, paddingVertical: space.md, paddingHorizontal: space.sm, alignItems: "center", gap: 6, minHeight: 72, justifyContent: "center" },
  label: { fontFamily: "Manrope-ExtraBold", color: "white", fontWeight: "800", fontSize: 14 },
});
