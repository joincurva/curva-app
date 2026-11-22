import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { FollowButton } from "../../components/follow-button";
import { State } from "../../components/ui";
import { getBrowse, performerSlug, type BrowseBroadway, type BrowseChampionships, type BrowseTeams } from "../../lib/api";
import { monogram, stageColor } from "../../lib/identity";
import { brand, colors, radius, space } from "../../lib/theme";

type Section = "teams" | "broadway" | "championships";
const COPY: Record<Section, { title: string; intro: string }> = {
  teams: { title: "Follow your team", intro: "One tap and Curva reminds you before every official presale and on-sale for your team's games, then sends you to the official seller at face value." },
  broadway: { title: "Every show on Broadway", intro: "Follow a show and Curva reminds you before every official presale and on-sale it can see. Tickets always go to the show's official seller." },
  championships: { title: "Playoffs and championships", intro: "The big games fans plan around. Official dates appear here as soon as they're listed, with a link straight to the official sale." },
};

const open = (url: string) => void WebBrowser.openBrowserAsync(url, { controlsColor: brand.navy, dismissButtonStyle: "done" }).catch(() => undefined);
const dateLabel = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const saleLabel = (iso: string, timeZone: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" });

function Badge({ name }: { name: string }) {
  return (
    <View style={[s.badge, { backgroundColor: stageColor(name.toLowerCase()) }]} accessibilityElementsHidden importantForAccessibility="no">
      <Text style={s.badgeText}>{monogram(name)}</Text>
    </View>
  );
}

function Hero({ section }: { section: Section }) {
  return (
    <View style={s.hero}>
      <Text accessibilityRole="header" style={s.heroTitle}>{COPY[section].title}</Text>
      <Text style={s.heroBody}>{COPY[section].intro}</Text>
    </View>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return <Text style={s.footnote}>{children}</Text>;
}

function useData<T>(section: Section) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getBrowse<T>(section));
    } catch (x) {
      setError(x instanceof Error ? x.message : "Couldn't load this list.");
    } finally {
      setLoading(false);
    }
  }, [section]);
  useEffect(() => void load(), [load]);
  return { data, error, loading, load };
}

function Teams() {
  const { data, error, loading, load } = useData<BrowseTeams>("teams");
  const list = useRef<SectionList>(null);
  const sections = useMemo(() => (data?.leagues ?? []).map((league) => ({ title: league.title, data: league.teams })), [data]);
  return (
    <SectionList
      ref={list}
      sections={sections}
      keyExtractor={(team) => team.slug}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ gap: space.lg }}>
          <Hero section="teams" />
          {sections.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {sections.map((league, sectionIndex) => (
                <Pressable key={league.title} accessibilityRole="button" accessibilityLabel={`Jump to ${league.title}`} style={s.chip} onPress={() => list.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewOffset: 8 })}>
                  <Text style={s.chipText}>{league.title.replace("College: ", "")}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" style={s.chip} onPress={() => router.push("/browse/championships")}>
                <Text style={s.chipText}>Playoffs</Text>
              </Pressable>
            </ScrollView>
          ) : null}
          {error ? <State kind="error" message={error} onRetry={load} /> : loading && !data ? <State kind="loading" message="Loading teams…" /> : null}
        </View>
      }
      renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={s.sectionTitle}>{section.title}</Text>}
      renderItem={({ item }) => (
        <View style={s.row}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}: dates and sales`} style={s.rowMain} onPress={() => router.push({ pathname: "/presales/[performer]", params: { performer: performerSlug(item.name), name: item.name, kind: "team", ...(item.officialUrl ? { officialUrl: item.officialUrl } : {}) } })}>
            <Badge name={item.name} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={2}>{item.name}</Text>
              {item.officialUrl ? (
                <Text style={s.link} onPress={() => open(item.officialUrl!)} accessibilityRole="link">Official tickets</Text>
              ) : null}
            </View>
          </Pressable>
          <FollowButton compact kind="team" name={item.name} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListFooterComponent={data ? <Footnote>Curva never shows resale listings. Ticket links go to each team's official seller. Curva isn't affiliated with any team or league.</Footnote> : null}
    />
  );
}

function Broadway() {
  const { data, error, loading, load } = useData<BrowseBroadway>("broadway");
  return (
    <FlatList
      data={data?.shows ?? []}
      keyExtractor={(show) => show.name}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ gap: space.lg, marginBottom: space.lg }}>
          <Hero section="broadway" />
          {error ? <State kind="error" message={error} onRetry={load} /> : loading && !data ? <State kind="loading" message="Loading shows…" /> : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      renderItem={({ item }) => {
        const isNew = Date.now() - Date.parse(`${item.opened}T12:00:00Z`) < 120 * 86_400_000;
        return (
          <View style={[s.card, { borderTopColor: stageColor(item.name.toLowerCase()) }]}>
            <View style={s.cardHead}>
              <Badge name={item.name} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={s.titleRow}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  {item.limited ? <Text style={s.tag}>Limited run</Text> : isNew ? <Text style={s.tag}>New</Text> : null}
                </View>
                <Text style={s.meta}>{item.theater}{item.limited ? ` · ${item.limited}` : ""}</Text>
              </View>
            </View>
            {item.sale ? <Text style={s.line}><Text style={{ fontWeight: "800" }}>{item.sale.label}</Text> opens {saleLabel(item.sale.start, item.sale.timeZone)}</Text> : null}
            {item.nextDate ? <Text style={s.line}>Next performance: {dateLabel(item.nextDate)}</Text> : null}
            <View style={s.actions}>
              <FollowButton compact kind="show" name={item.name} />
              {item.officialUrl ? (
                <Pressable accessibilityRole="link" onPress={() => open(item.officialUrl!)} style={s.secondary}>
                  <Text style={s.secondaryText}>Official tickets</Text>
                  <Ionicons name="open-outline" size={15} color={colors.cobalt} />
                </Pressable>
              ) : item.boxOffice ? <Text style={s.meta}>Tickets: {item.boxOffice}</Text> : null}
              {item.nextDate ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/presales/[performer]", params: { performer: performerSlug(item.match), name: item.name, kind: "show", ...(item.officialUrl ? { officialUrl: item.officialUrl } : {}) } })} style={s.secondary}>
                  <Text style={s.secondaryText}>See dates</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      }}
      ListFooterComponent={data ? (
        <Footnote>
          Show list checked {dateLabel(data.checkedOn)} against <Text style={s.link} onPress={() => open(data.source.url)}>{data.source.label}</Text>. Curva never shows resale listings. If a show is sold out, check its official site and box office for released seats and rush or lottery tickets.
        </Footnote>
      ) : null}
    />
  );
}

function Championships() {
  const { data, error, loading, load } = useData<BrowseChampionships>("championships");
  return (
    <FlatList
      data={data?.championships ?? []}
      keyExtractor={(c) => c.slug}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ gap: space.lg, marginBottom: space.lg }}>
          <Hero section="championships" />
          {error ? <State kind="error" message={error} onRetry={load} /> : loading && !data ? <State kind="loading" message="Loading championships…" /> : null}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      renderItem={({ item }) => (
        <View style={[s.card, { borderTopColor: stageColor(item.slug) }]}>
          <Text style={s.kicker}>{item.sport} · {item.when}</Text>
          <Text style={s.cardTitle}>{item.name}</Text>
          {item.events.length ? item.events.map((event) => (
            <Pressable key={`${event.name}-${event.date}`} accessibilityRole="link" accessibilityLabel={`${event.name}, ${dateLabel(event.date)}. Official tickets.`} onPress={() => open(event.officialUrl)} style={s.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.eventName} numberOfLines={2}>{event.name}</Text>
                <Text style={s.meta} numberOfLines={1}>{dateLabel(event.date)}{event.venue ? ` · ${event.venue}` : ""}{event.city ? `, ${event.city}` : ""}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.cobalt} />
            </Pressable>
          )) : <Text style={s.meta}>No official dates listed yet. They'll show here the moment they are.</Text>}
        </View>
      )}
      ListFooterComponent={data ? <Footnote>Dates come from official ticket listings, checked twice a day, and can change. Every link goes to the official sale. Curva never shows resale listings.</Footnote> : null}
    />
  );
}

export default function Browse() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const which: Section = section === "broadway" || section === "championships" ? section : "teams";
  return (
    <View style={s.screen}>
      <Stack.Screen options={{ title: which === "teams" ? "Teams" : which === "broadway" ? "Broadway" : "Championships" }} />
      {which === "teams" ? <Teams /> : which === "broadway" ? <Broadway /> : <Championships />}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.xl, paddingBottom: 80 },
  hero: { backgroundColor: brand.navy, borderRadius: radius.card, padding: space.xl, gap: space.sm },
  heroTitle: { fontFamily: "Manrope-ExtraBold", color: "white", fontSize: 26, fontWeight: "800", letterSpacing: -0.4 },
  heroBody: { fontFamily: "Manrope-Regular", color: brand.mist, fontSize: 15, lineHeight: 21 },
  chips: { gap: space.sm, paddingRight: space.xl },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: "Manrope-Bold", color: colors.ink, fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontFamily: "Manrope-ExtraBold", color: colors.ink, fontSize: 20, fontWeight: "800", marginTop: space.xl, marginBottom: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, padding: space.md },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.md },
  rowTitle: { fontFamily: "Manrope-Bold", color: colors.ink, fontSize: 16, fontWeight: "700" },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: "Manrope-ExtraBold", color: "white", fontWeight: "800", fontSize: 13 },
  link: { fontFamily: "Manrope-Bold", color: colors.cobalt, fontWeight: "700", fontSize: 14, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderTopWidth: 4, borderRadius: radius.card, padding: space.lg, gap: space.sm },
  cardHead: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  cardTitle: { fontFamily: "Manrope-ExtraBold", color: colors.ink, fontSize: 18, fontWeight: "800" },
  tag: { fontFamily: "Manrope-Bold", backgroundColor: colors.canvas, color: colors.ink, fontSize: 12, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  kicker: { fontFamily: "Manrope-Bold", color: colors.muted, fontSize: 13, fontWeight: "700" },
  meta: { fontFamily: "Manrope-Regular", color: colors.muted, fontSize: 14, lineHeight: 19 },
  line: { fontFamily: "Manrope-Regular", color: colors.ink, fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.md, marginTop: space.xs },
  secondary: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 },
  secondaryText: { fontFamily: "Manrope-ExtraBold", color: colors.cobalt, fontWeight: "800", fontSize: 15 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  eventName: { fontFamily: "Manrope-Bold", color: colors.ink, fontSize: 15, fontWeight: "700" },
  footnote: { fontFamily: "Manrope-Regular", color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: space.xl },
});
