import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { State } from "../components/ui";
import { getMyEvents } from "../lib/api";
import { buildRecap, recapText } from "../lib/recap";
import { useSession } from "../lib/session";
import { brand, colors, radius, space } from "../lib/theme";
import { showDate } from "../lib/time";

/** Your year in live events: every show you went to, with your memories, ready to share. */
export default function Recap() {
  const { session } = useSession();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [recap, setRecap] = useState<ReturnType<typeof buildRecap>>();
  useEffect(() => {
    if (!session) return;
    void getMyEvents(session.token).then((r) => setRecap(buildRecap(r.events, today.getFullYear(), todayIso))).catch(() => setRecap(buildRecap([], today.getFullYear(), todayIso)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
      <View style={s.band}>
        <Text style={s.kicker}>Your {today.getFullYear()}</Text>
        <Text style={s.big}>{recap ? recap.count : "—"}</Text>
        <Text style={s.title}>live event{recap?.count === 1 ? "" : "s"}</Text>
        {recap && recap.count ? (
          <Text style={s.sub}>
            {recap.venueCount > 1 ? `${recap.venueCount} venues` : ""}{recap.venueCount > 1 && recap.cityCount > 1 ? " · " : ""}{recap.cityCount > 1 ? `${recap.cityCount} cities` : ""}
          </Text>
        ) : null}
        {recap && recap.count ? (
          <Pressable accessibilityRole="button" onPress={() => void Share.share({ message: recapText(recap) }).catch(() => undefined)} style={s.share}>
            <Ionicons name="share-outline" size={18} color={brand.navy} />
            <Text style={s.shareText}>Share your year</Text>
          </Pressable>
        ) : null}
      </View>
      {!recap ? <State kind="loading" message="Putting your year together…" /> : null}
      {recap && !recap.count ? (
        <State kind="empty" message="Shows you mark as going land here after the night, with your memories. Tap 'Yes, I'm going' after you get tickets." />
      ) : null}
      {recap?.items.map((i) => (
        <Pressable key={i.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/show/[id]", params: { id: i.id, show: JSON.stringify(i.event) } })} style={s.row}>
          <Text style={s.rowDate}>{showDate(i.date)}</Text>
          <Text style={s.rowTitle}>{i.name}</Text>
          {i.venue ? <Text style={s.rowMeta}>{i.venue}{i.city ? `, ${i.city}` : ""}</Text> : null}
          {i.companions ? <Text style={s.rowMeta}>With {i.companions}</Text> : null}
          {i.memory ? <Text style={s.memory}>“{i.memory}”</Text> : <Text style={s.add}>Add a memory</Text>}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.md, paddingBottom: 60 },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: 4, borderBottomWidth: 4, borderBottomColor: brand.gold, alignItems: "flex-start" },
  kicker: { color: brand.gold, fontWeight: "800", fontSize: 14 },
  big: { color: "white", fontSize: 64, fontWeight: "800", lineHeight: 70, fontVariant: ["tabular-nums"] },
  title: { color: "white", fontSize: 22, fontWeight: "800" },
  sub: { color: brand.mist, fontSize: 15 },
  share: { marginTop: space.md, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: brand.gold, borderRadius: radius.control, paddingHorizontal: 16, minHeight: 44 },
  shareText: { color: brand.navy, fontWeight: "800" },
  row: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: 3 },
  rowDate: { fontSize: 13, fontWeight: "700", color: colors.cobalt },
  rowTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
  rowMeta: { fontSize: 14, color: colors.muted },
  memory: { marginTop: 4, fontSize: 15, fontStyle: "italic", color: colors.ink },
  add: { marginTop: 4, fontSize: 14, fontWeight: "700", color: colors.cobalt },
});
