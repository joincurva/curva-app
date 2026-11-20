import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { getSignups, setSignupStatus } from "../lib/api";
import { useSession } from "../lib/session";
import { brand, colors, radius, space } from "../lib/theme";
import type { PresaleSignup } from "../lib/types";

const closes = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No deadline set";

/** Presale sign-ups the fan is tracking (same list as the website), with one-tap "I'm registered". */
export function SignupList() {
  const { session } = useSession();
  const [items, setItems] = useState<PresaleSignup[]>([]);
  const load = useCallback(() => {
    if (!session) return;
    void getSignups(session.token).then((r) => setItems(r.signups)).catch(() => undefined);
  }, [session]);
  useEffect(load, [load]);
  useFocusEffect(load);
  if (!items.length) return null;
  const toggle = async (item: PresaleSignup) => {
    if (!session) return;
    const next = item.status === "to-do" ? "registered" : "to-do";
    setItems((v) => v.map((x) => (x.id === item.id ? { ...x, status: next } : x)));
    await setSignupStatus(item.id, next, session.token).catch(load);
  };
  return (
    <View style={s.card}>
      <Text style={s.h2}>Presale sign-ups</Text>
      {items.map((item) => (
        <View key={item.id} style={s.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.meta}>Closes {closes(item.signup_closes_at)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ checked: item.status !== "to-do" }} onPress={() => void toggle(item)} style={[s.pill, item.status !== "to-do" && s.pillOn]}>
            <Text style={[s.pillText, item.status !== "to-do" && { color: brand.navy }]}>{item.status === "to-do" ? "Mark registered" : "Registered"}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  h2: { fontSize: 19, fontWeight: "800", color: colors.ink },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  pill: { minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: brand.navy, justifyContent: "center" },
  pillOn: { backgroundColor: brand.gold },
  pillText: { color: "white", fontWeight: "800", fontSize: 13 },
});
