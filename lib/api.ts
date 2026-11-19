import { config } from "./config";
import type { ApiError } from "./types";

let unauthorizedHandler: (() => void) | undefined;

export function configureUnauthorizedHandler(handler?: () => void) {
  unauthorizedHandler = handler;
}

function fallbackMessage(status: number) {
  if (status === 401) return "Your session has ended. Sign in again.";
  if (status === 403) return "Your account cannot perform that action.";
  if (status === 404) return "That item is no longer available.";
  if (status === 409) return "That change conflicts with newer information. Refresh and try again.";
  if (status === 429) return "Curva is receiving too many requests. Wait a moment and try again.";
  if (status >= 500) return "Curva is temporarily unavailable. Please try again.";
  return "Curva could not complete that request.";
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error && error.name === "AbortError"
        ? "Curva took too long to respond. Check your connection and try again."
        : "Curva could not connect. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(
      "Curva received an unreadable server response. Please try again.",
    );
  }
  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
    const error = new Error(
      typeof payload.error === "string" && payload.error.includes(" ")
        ? payload.error
        : fallbackMessage(response.status),
    ) as ApiError;
    error.status = response.status;
    error.code = String(payload.error ?? "");
    error.payload = payload;
    throw error;
  }
  return payload as T;
}
export const getEvents = (params: URLSearchParams) =>
  request<{
    events: import("./types").Event[];
    meta?: { page: number; totalPages?: number; partial?: boolean };
    observedAt: string;
  }>(`/api/discovery/events?${params}`);
export const getPresales = (query = "") =>
  request<{ sales: import("./types").PresaleWindow[]; source: string }>(
    `/api/presales${query ? `?q=${encodeURIComponent(query)}` : ""}`,
  );
/** Saves a sale reminder for this show: Curva emails the day before and right before the queue opens. */
export const saveSaleReminder = (
  date: import("./types").PresaleDate,
  token: string,
) =>
  request<unknown>(
    "/api/fan-events",
    {
      method: "POST",
      body: JSON.stringify({
        provider: "ticketmaster",
        providerEventId: date.id,
        eventName: date.name,
        eventDate: date.date.slice(0, 10),
        venueName: date.venue || undefined,
        city: date.city || undefined,
        officialUrl: date.officialUrl || undefined,
        state: "SAVED",
        source: "fan-declared",
        sourceReference: "app-presales",
      }),
    },
    token,
  );
export const getMySales = (token: string) =>
  request<{ watching: number; sales: import("./types").MySale[] }>("/api/presales/mine", {}, token);
