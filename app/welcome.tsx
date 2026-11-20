import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFollowSuggestions } from "../lib/api";
import { followKey, useFollows } from "../lib/follows";
import { turnOnSaleAlerts } from "../lib/push";
import { useSession } from "../lib/session";
import { brand, colors, radius, space } from "../lib/theme";

/** First step after sign-in: follow the artists, teams and shows you never want to miss. */
export default function Welcome() {
  const { session } = useSession();
  const { follows, isFollowing, follow, unfollow } = useFollows();
  const [ideas, setIdeas] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string>();
  useEffect(() => {
    void getFollowSuggestions()
      .then((r) => setIdeas(r.suggestions.map((s) => s.name)))
      .catch(() => undefined);
  }, []);
  const toggle = async (name: string) => {
    setBusy(followKey(name));
    try {
      if (isFollowing(name)) await unfollow(name);
      else await follow(name);
    } finally {
      setBusy(undefined);
    }
  };
  const add = () => {
    const name = query.trim();
    if (name.length < 2) return;
    setQuery("");
    void toggle(name);
  };
  const done = async () => {
    if (session && follows.length) await turnOnSaleAlerts(session.token).catch(() => undefined);
    router.replace("/(tabs)");
  };
  const names = [...follows.map((f) => f.name), ...ideas.filter((i) => !isFollowing(i))];
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.band}>
        <Text style={s.brand}>curva</Text>
        <Text style={s.title} accessibilityRole="header">Who do you never want to miss?</Text>
        <Text style={s.sub}>Follow artists, teams and shows. Curva alerts you before every presale and on-sale, including dates announced later.</Text>
      </View>
      <View style={s.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="Artist, team or show"
          autoCapitalize="words"
          onChangeText={setQuery}
          onSubmitEditing={add}
          placeholder="Artist, team or show"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={s.input}
          value={query}
        />
        {query.trim().length >= 2 ? (
          <Pressable accessibilityRole="button" onPress={add} style={s.addBtn}>
            <Text style={s.addText}>Follow</Text>
          </Pressable>
        ) : null}
      </View>
      {ideas.length ? <Text style={s.hint}>Sales coming up soon</Text> : null}
      <View style={s.chips}>
        {names.map((name) => {
          const on = isFollowing(name);
          return (
            <Pressable
              key={followKey(name)}
              accessibilityRole="button"
              accessibilityState={{ checked: on, disabled: busy === followKey(name) }}
              onPress={() => void toggle(name)}
              style={[s.chip, on && s.chipOn]}
            >
              <Ionicons name={on ? "checkmark" : "add"} size={16} color={on ? brand.navy : colors.ink} />
              <Text style={[s.chipText, on && { color: brand.navy }]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={() => void done()} style={s.done}>
        <Text style={s.doneText}>{follows.length ? `Done · following ${follows.length}` : "Skip for now"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingTop: 64, paddingBottom: 60 },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm, borderBottomWidth: 4, borderBottomColor: brand.gold },
  brand: { color: brand.periwinkle, fontSize: 18, fontWeight: "800" },
  title: { color: "white", fontSize: 28, lineHeight: 33, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: brand.mist, fontSize: 16, lineHeight: 22 },
  search: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingLeft: space.md, minHeight: 52 },
  input: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  addBtn: { backgroundColor: brand.gold, borderRadius: radius.control, paddingHorizontal: 16, minHeight: 40, justifyContent: "center", marginRight: 6 },
  addText: { color: brand.navy, fontWeight: "800" },
  hint: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: brand.gold, borderColor: brand.gold },
  chipText: { fontWeight: "700", fontSize: 15, color: colors.ink },
  done: { backgroundColor: brand.navy, minHeight: 54, borderRadius: radius.control, alignItems: "center", justifyContent: "center", marginTop: space.md },
  doneText: { color: "white", fontWeight: "800", fontSize: 16 },
});
