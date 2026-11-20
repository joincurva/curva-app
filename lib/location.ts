import * as Location from "expo-location";
import { request } from "./api";

type Near = { location: string | null; city?: string; region?: string; source?: "device" | "network" };

let cached: string | undefined;

/** Nearest city from the network (no permission prompt). Used to make the first screen local. */
export async function approximateCity() {
  if (cached !== undefined) return cached;
  const r = await request<Near>("/api/location/near").catch(() => ({ location: null }) as Near);
  cached = r.location ?? "";
  return cached;
}

/** Nearest city from the device, after the fan taps Near me. Coordinates go to the lookup only and aren't stored. */
export async function deviceCity(): Promise<{ city?: string; denied?: boolean }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return { denied: true, city: (await approximateCity()) || undefined };
  const pos = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 }) ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const r = await request<Near>(`/api/location/near?lat=${pos.coords.latitude.toFixed(3)}&lng=${pos.coords.longitude.toFixed(3)}`).catch(() => ({ location: null }) as Near);
  if (r.location) cached = r.location;
  return { city: r.location ?? undefined };
}
