import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { brand, colors, radius, space } from "../lib/theme";

/** The one place a fan leaves Curva to pay: framed so they know what happens and that Done brings them back. */
export function TicketHandoff({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={s.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the official Ticketmaster page inside Curva. Tap Done to come back."
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [s.button, pressed && { opacity: 0.8 }, disabled && { opacity: 0.45 }]}
      >
        <Ionicons name="ticket-outline" size={20} color={brand.navy} />
        <Text style={s.buttonText}>{label}</Text>
      </Pressable>
      <View style={s.noteRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
        <Text style={s.note}>
          Opens Ticketmaster&apos;s official page right here in Curva. You check out with them at face value, then tap
          Done to come back.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { gap: space.sm },
  button: {
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: brand.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  buttonText: { fontFamily: "Manrope-ExtraBold", color: brand.navy, fontWeight: "800", fontSize: 16 },
  noteRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  note: { fontFamily: "Manrope-Regular", flex: 1, fontSize: 13, lineHeight: 18, color: colors.muted },
});
