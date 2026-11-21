import { useCallback, useEffect, useState } from "react";
import { followName, getFollows, unfollowName } from "./api";
import { turnOnSaleAlerts } from "./push";
import { useSession } from "./session";
import type { Follow } from "./types";

export const followKey = (name: string) => name.normalize("NFKC").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// One shared list for every screen, so following on one screen shows everywhere.
let cache: Follow[] | undefined;
// Whose list the cache holds ("" when signed out), so it reloads once the saved session has loaded
// and again after signing in or out, instead of keeping an empty list fetched before the session was ready.
let cacheOwner: string | undefined;
const listeners = new Set<(f: Follow[]) => void>();
const publish = (f: Follow[]) => {
  cache = f;
  listeners.forEach((l) => l(f));
};

export function useFollows() {
  const { session, ready } = useSession();
  const [follows, setFollows] = useState<Follow[]>(cache ?? []);
  useEffect(() => {
    listeners.add(setFollows);
    return () => void listeners.delete(setFollows);
  }, []);
  const refresh = useCallback(async () => {
    if (!session) return publish([]);
    const r = await getFollows(session.token).catch(() => undefined);
    if (r) publish(r.follows);
  }, [session]);
  useEffect(() => {
    if (!ready) return;
    const owner = session?.token ?? "";
    if (cacheOwner === owner && cache !== undefined) return;
    cacheOwner = owner;
    void refresh();
  }, [ready, session, refresh]);
  const isFollowing = (name: string) => follows.some((f) => f.name_key === followKey(name));
  const follow = async (name: string) => {
    if (!session) throw new Error("Sign in to follow.");
    await followName(name, session.token);
    void turnOnSaleAlerts(session.token).catch(() => undefined);
    await refresh();
  };
  const unfollow = async (name: string) => {
    if (!session) return;
    await unfollowName(name, session.token);
    await refresh();
  };
  return { follows, isFollowing, follow, unfollow, refresh, signedIn: Boolean(session) };
}
