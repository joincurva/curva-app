import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFollows } from "../lib/follows";
import type { Follow } from "../lib/types";
import { brand, colors, radius } from "../lib/theme";

/** Follow an artist, team or show: every future presale and on-sale, one alert per sale. */
export function FollowButton({ name, onDark = false, compact = false, kind = "artist" }: { name: string; onDark?: boolean; compact?: boolean; kind?: Follow["kind"] }) {
  const { isFollowing, follow, unfollow, signedIn } = useFollows();
  const [busy, setBusy] = useState(false);
  const on = isFollowing(name);
  const press = async () => {
    if (!signedIn) {
      Alert.alert(`Follow ${name}`, "Sign in and Curva alerts you before every presale and on-sale, including dates announced later.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    setBusy(true);
    try {
      if (on) await unfollow(name);
      else {
        await follow(name, kind);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    } catch (x) {
      Alert.alert("Couldn't update", x instanceof Error ? x.message : "Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: on, disabled: busy }}
      accessibilityLabel={on ? `Following ${name}. Tap to unfollow.` : `Follow ${name}`}
      disabled={busy}
      onPress={() => void press()}
      style={({ pressed }) => [s.button, compact && s.compact, on ? (onDark ? s.onDarkOn : s.on) : onDark ? s.offDark : s.off, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name={on ? "checkmark" : "add"} size={18} color={on ? brand.navy : onDark ? brand.navy : "white"} />
      <Text style={[s.text, { color: on || onDark ? brand.navy : "white" }]}>{on ? "Following" : compact ? "Follow" : `Follow ${name}`}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { minHeight: 44, borderRadius: radius.control, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  off: { backgroundColor: brand.navy },
  offDark: { backgroundColor: brand.gold },
  on: { backgroundColor: colors.border },
  onDarkOn: { backgroundColor: brand.mist },
  compact: { minHeight: 36, paddingHorizontal: 12, alignSelf: "center" },
  text: { fontWeight: "800", fontSize: 15 },
});
