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
  label: string;
  kind: "presale" | "onsale";
  start: string;
  time: string;
  timeZone: string;
  dates: PresaleDate[];
};
