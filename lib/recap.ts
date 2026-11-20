import type { FanEvent } from "./types";

// Same rules as the website's "Your year": shows the fan marked as going, on dates that have passed.
const counted = new Set(["MARKED_GOING", "PLANNING", "PURCHASE_CONFIRMED", "EVENT_DAY", "ATTENDED", "COMPLETED", "REMEMBERED"]);

export function buildRecap(events: readonly FanEvent[], year: number, todayIso: string) {
  const items = events
    .filter((e) => e.event_date && counted.has(e.lifecycle_state))
    .map((e) => ({ id: e.id, name: e.event_name, date: e.event_date!.slice(0, 10), venue: e.venue_name ?? undefined, city: e.city ?? undefined, memory: e.memory_note?.trim() || undefined, companions: e.companions?.trim() || undefined, event: e }))
    .filter((i) => i.date.startsWith(`${year}-`) && i.date <= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));
  const venues = new Set(items.map((i) => i.venue).filter(Boolean));
  const cities = new Set(items.map((i) => i.city).filter(Boolean));
  return { year, count: items.length, venueCount: venues.size, cityCount: cities.size, items };
}

export function recapText(r: ReturnType<typeof buildRecap>) {
  const parts = [`${r.count} live event${r.count === 1 ? "" : "s"}`, ...(r.venueCount > 1 ? [`${r.venueCount} venues`] : []), ...(r.cityCount > 1 ? [`${r.cityCount} cities`] : [])];
  return [`My ${r.year} in live events: ${parts.join(", ")}.`, ...r.items.map((i) => `- ${i.name}${i.venue ? ` at ${i.venue}` : ""}`), "", "Made with Curva, your live-event life in one place. joincurva.com"].join("\n");
}
