import { useEffect, useState } from "react";

export function dayLabel(iso: string, timeZone: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone });
}

export function showDate(date: string) {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Opens in 2d 4h", "Opens in 12m 08s", or "Open now". */
export function countdown(startIso: string, now: number) {
  const ms = new Date(startIso).getTime() - now;
  if (!Number.isFinite(ms)) return "";
  if (ms <= 0) return "Open now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `Opens in ${d}d ${h}h`;
  if (h > 0) return `Opens in ${h}h ${m}m`;
  return `Opens in ${m}m ${String(sec).padStart(2, "0")}s`;
}

/** Ticks every second in the last hour before a sale, otherwise every 30 seconds. */
export function useNow(startIso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const left = startIso ? new Date(startIso).getTime() - now : Infinity;
    const timer = setTimeout(() => setNow(Date.now()), left > 0 && left < 3_600_000 ? 1000 : 30_000);
    return () => clearTimeout(timer);
  }, [now, startIso]);
  return now;
}
