export type Event = {
  id: string;
  name: string;
  category: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
  region?: string;
  officialUrl?: string;
  saleStatus: string;
  imageUrl?: string;
  imageAlt?: string;
  source?: "Ticketmaster";
};
export type Alert = {
  id: string;
  query: string;
  eventName?: string;
  venue?: string;
  city?: string;
  status: "pending" | "active" | "paused" | "deleted";
  quantity: number;
  monitoringStatus?: string;
  createdAt?: string;
};
export type User = { id: string; email: string; displayName?: string };
export type ApiError = Error & {
  status?: number;
  code?: string;
  payload?: Record<string, unknown>;
};
export type PresaleDate = {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  region?: string;
  officialUrl: string;
};
export type PresaleWindow = {
  key: string;
  title: string;
  /** The artist, team or show to follow for this sale. */
  performer?: string;
  label: string;
  kind: "presale" | "onsale";
  start: string;
  time: string;
  timeZone: string;
  dates: PresaleDate[];
};
export type MySale = {
  key: string;
  title: string;
  label: string;
  kind: "presale" | "onsale";
  start: string;
  time: string;
  timeZone: string;
  dates: number;
  eventId?: string;
};

export type FanEvent = {
  id: string;
  provider: string;
  provider_event_id: string;
  event_name: string;
  event_date: string | null;
  venue_name: string | null;
  city: string | null;
  official_url: string | null;
  lifecycle_state: string;
  change_kind: string | null;
  previous_event_date: string | null;
};

/** States that mean the fan has tickets or is going. */
export const GOING_STATES = ["MARKED_GOING", "PLANNING", "PURCHASE_CONFIRMED", "EVENT_DAY"] as const;

export type Follow = { name: string; name_key: string; kind: "artist" | "team" | "show" | "venue"; created_at: string };

export type Companion = {
  id: string; name: string; date: string; time?: string; timeZone?: string;
  venue: string; city: string; region?: string; officialUrl?: string; saleStatus?: string;
  venueGuide: { parking?: string; accessibility?: string; rules?: string; childPolicy?: string; willCall?: string; boxOfficeHours?: string } | null;
  directions: { apple: string; appleTransit: string; google: string };
  weather: { label: string; summary: string; temperature: number; unit: string; rainChance?: number; source: string } | null;
  sources: string[];
};

export type PerformerDate = { id: string; name: string; date: string; time?: string; venue: string; city: string; region?: string; officialUrl?: string; saleStatus: string; milesAway?: number };
export type Performer = { name: string; slug: string; dates: PerformerDate[]; sales: PresaleWindow[] };
