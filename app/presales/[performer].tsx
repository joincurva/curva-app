import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { State } from "../../components/ui";
import { getPresales } from "../../lib/api";
import { brand, colors, radius, space } from "../../lib/theme";
import { countdown, dayLabel, useNow } from "../../lib/time";
import type { PresaleWindow } from "../../lib/types";

/** joincurva.com/presales/<performer> links open here when the app is installed. */
export default function PerformerPresales() {
  const { performer = "" } = useLocalSearchParams<{ performer: string }>();
  const name = decodeURIComponent(performer).replace(/-/g, " ");
  const [sales, setSales] = useState<PresaleWindow[] | undefined>();
  const [error, setError] = useState("");
  const now = useNow();
  useEffect(() => {
    let live = true;
    getPresales(name)
      .then((r) => live && setSales(r.sales))
      .catch((x) => live && setError(x instanceof Error ? x.message : "Presales could not load."));
    return () => {
      live = false;
    };
  }, [name]);
  return (
    <View style={s.page}>
      <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
      <FlatList
        data={sales ?? []}
        keyExtractor={(x) => x.key}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.band}>
            <Text style={s.title} accessibilityRole="header">
              {name.replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
            <Text style={s.sub}>Official presales and on-sales in the next 30 days.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/sale/[key]", params: { key: item.key, title: item.title, sale: JSON.stringify(item) } })
            }
            style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.rowTitle}>{item.label}</Text>
              <Text style={s.rowMeta}>
                {dayLabel(item.start, item.timeZone)} · {item.time} · {countdown(item.start, now)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          error ? (
            <State kind="error" message={error} />
          ) : !sales ? (
            <State kind="loading" message="Loading official sale times…" />
          ) : (
            <State kind="empty" message="No official sales in the next 30 days. Check Presales for everything else." />
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.md, paddingBottom: 60 },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm, borderBottomWidth: 4, borderBottomColor: brand.gold, marginBottom: space.sm },
  title: { color: "white", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: brand.mist, fontSize: 15, lineHeight: 21 },
  row: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.md },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.muted },
});
