import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { State } from "../../components/ui";
import { FollowButton } from "../../components/follow-button";
import { getPerformer } from "../../lib/api";
import { brand, colors, radius, space } from "../../lib/theme";
import { countdown, dayLabel, showDate, useNow } from "../../lib/time";
import type { Event, Performer, PerformerDate } from "../../lib/types";

/** Artist, team or show hub: follow, official sales, the dates nearest you, and every date. */
export default function PerformerHub() {
  const { performer = "", name: givenName, kind = "artist", officialUrl } = useLocalSearchParams<{ performer: string; name?: string; kind?: "artist" | "team" | "show"; officialUrl?: string }>();
  const [data, setData] = useState<Performer>();
  const [error, setError] = useState("");
  const now = useNow();
  useEffect(() => {
    let live = true;
    getPerformer(performer)
      .then((r) => live && setData(r))
      .catch(() => live && setError("none"));
    return () => {
      live = false;
    };
  }, [performer]);
  const nearest = useMemo(
    () => (data?.dates ?? []).filter((d) => d.milesAway != null).sort((a, b) => (a.milesAway ?? 0) - (b.milesAway ?? 0)).slice(0, 3),
    [data],
  );
  const fallbackName = decodeURIComponent(performer).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const name = data?.name ?? givenName ?? fallbackName;
  const openOfficial = () => officialUrl && void WebBrowser.openBrowserAsync(officialUrl, { controlsColor: brand.navy, dismissButtonStyle: "done" }).catch(() => undefined);
  const openDate = (d: PerformerDate) => {
    const event: Event = { id: d.id, name: d.name, category: "", date: d.date, time: d.time, venue: d.venue, city: d.city, region: d.region, officialUrl: d.officialUrl, saleStatus: d.saleStatus, source: "Ticketmaster" };
    router.push({ pathname: "/event/[id]", params: { id: d.id, event: JSON.stringify(event) } });
  };
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Stack.Screen options={{ title: "", headerBackTitle: "Back" }} />
      <View style={s.band}>
        <Text style={s.title} accessibilityRole="header">{name}</Text>
        <Text style={s.sub}>
          {data ? `${data.dates.length} upcoming date${data.dates.length === 1 ? "" : "s"} on official listings` : "Official dates and sales"}
        </Text>
        <FollowButton name={name} kind={kind} onDark />
        {officialUrl ? (
          <Pressable accessibilityRole="link" onPress={openOfficial} style={s.officialLink}>
            <Text style={s.officialText}>Official tickets</Text>
            <Ionicons name="open-outline" size={15} color={brand.gold} />
          </Pressable>
        ) : null}
      </View>

      {error ? <State kind="empty" message={`No dates on official listings Curva can read right now. Follow ${name} and Curva tells you the moment new dates or sales are announced${officialUrl ? ", or tap Official tickets for the full schedule" : ""}.`} /> : !data ? <State kind="loading" message="Loading official dates…" /> : null}

      {data?.sales.length ? (
        <View style={s.section}>
          <Text style={s.h2}>Official sales</Text>
          {data.sales.map((sale) => (
            <Pressable
              key={sale.key}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/sale/[key]", params: { key: sale.key, title: sale.title, sale: JSON.stringify(sale) } })}
              style={s.row}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowTitle}>{sale.label}</Text>
                <Text style={s.rowMeta}>{dayLabel(sale.start, sale.timeZone)} · {sale.time} · {countdown(sale.start, now)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {nearest.length ? (
        <View style={s.section}>
          <Text style={s.h2}>Nearest to you</Text>
          {nearest.map((d) => <DateRow key={d.id} d={d} onPress={() => openDate(d)} />)}
        </View>
      ) : null}

      {data?.dates.length ? (
        <View style={s.section}>
          <Text style={s.h2}>All dates</Text>
          {data.dates.map((d) => <DateRow key={d.id} d={d} onPress={() => openDate(d)} />)}
        </View>
      ) : data ? (
        <State kind="empty" message={`No upcoming dates listed right now. Follow ${name} and Curva tells you the moment new dates are announced.`} />
      ) : null}

      <Text style={s.foot}>From Ticketmaster&apos;s official listings. Curva isn&apos;t affiliated with {name}.</Text>
    </ScrollView>
  );
}

function DateRow({ d, onPress }: { d: PerformerDate; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowTitle}>{showDate(d.date)}</Text>
        <Text style={s.rowMeta}>
          {d.venue}, {d.city}{d.region ? `, ${d.region}` : ""}{d.milesAway != null ? ` · ${d.milesAway} mi away` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  band: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm, borderBottomWidth: 4, borderBottomColor: brand.gold },
  title: { fontFamily: "Manrope-ExtraBold", color: "white", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontFamily: "Manrope-Regular", color: brand.mist, fontSize: 15, lineHeight: 21 },
  section: { gap: space.sm },
  h2: { fontFamily: "Manrope-ExtraBold", fontSize: 19, fontWeight: "800", color: colors.ink },
  row: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.md },
  rowTitle: { fontFamily: "Manrope-Bold", fontSize: 16, fontWeight: "700", color: colors.ink },
  rowMeta: { fontFamily: "Manrope-Regular", fontSize: 13, color: colors.muted },
  foot: { fontFamily: "Manrope-Regular", fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: "center" },
  officialLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 },
  officialText: { fontFamily: "Manrope-ExtraBold", color: brand.gold, fontWeight: "800", fontSize: 15 },
});
