import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { addSignup } from "../lib/api";
import { useSession } from "../lib/session";
import { brand, colors, radius, space } from "../lib/theme";

/** Closing time a few days out, at 11:59 PM on the fan's phone. */
function closesIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

const CHOICES = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 2 days", days: 2 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
] as const;

/**
 * Some presales need a sign-up first (Verified Fan, fan clubs). The fan picks when sign-up closes,
 * as the official page says, and Curva reminds them before it does.
 */
export function SignupTracker({ title, providerEventId, presaleOpensAt }: { title: string; providerEventId?: string; presaleOpensAt?: string }) {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<string>();
  const save = async (days: number, label: string) => {
    if (!session) {
      Alert.alert("Sign in to track sign-ups", "Curva reminds you the day before and right before sign-up closes.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    try {
      await addSignup({ title: `${title} sign-up`, providerEventId, signupClosesAt: closesIn(days), presaleOpensAt }, session.token);
      setSaved(label);
      setOpen(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (x) {
      Alert.alert("Couldn't save that", x instanceof Error ? x.message : "Try again in a moment.");
    }
  };
  if (saved)
    return (
      <View style={s.saved}>
        <Ionicons name="checkmark-circle" size={18} color={colors.cobalt} />
        <Text style={s.savedText}>Sign-up deadline saved ({saved.toLowerCase()}). We&apos;ll remind you before it closes.</Text>
      </View>
    );
  return (
    <View style={s.box}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={s.toggle}>
        <Ionicons name="create-outline" size={18} color={colors.cobalt} />
        <Text style={s.toggleText}>Needs a sign-up first? Track the deadline</Text>
      </Pressable>
      {open ? (
        <>
          <Text style={s.help}>When does sign-up close? Check the official page, then pick one.</Text>
          <View style={s.chips}>
            {CHOICES.map((c) => (
              <Pressable key={c.label} accessibilityRole="button" onPress={() => void save(c.days, c.label)} style={s.chip}>
                <Text style={s.chipText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { gap: space.sm },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40 },
  toggleText: { color: colors.cobalt, fontWeight: "700", fontSize: 14 },
  help: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: "center", backgroundColor: colors.surface },
  chipText: { color: brand.navy, fontWeight: "700" },
  saved: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  savedText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
});
