import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { configureUnauthorizedHandler } from "./api";
import type { User } from "./types";
const KEY = "curva.native.session.v1";
type Session = { token: string; user: User };
const Context = createContext<{
  session?: Session;
  ready: boolean;
  setSession: (value?: Session) => Promise<void>;
}>({ ready: false, setSession: async () => {} });
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setValue] = useState<Session>();
  const [ready, setReady] = useState(false);
  const setSession = useCallback(async (value?: Session) => {
    if (value)
      await SecureStore.setItemAsync(KEY, JSON.stringify(value), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    else await SecureStore.deleteItemAsync(KEY);
    setValue(value);
  }, []);
  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (v) {
          const decoded: unknown = JSON.parse(v);
          if (
            decoded &&
            typeof decoded === "object" &&
            "token" in decoded &&
            "user" in decoded
          )
            setValue(decoded as Session);
        }
      })
      .catch(() => setValue(undefined))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    configureUnauthorizedHandler(() => {
      void setSession().catch(() => setValue(undefined));
    });
    return () => configureUnauthorizedHandler();
  }, [setSession]);
  return (
    <Context.Provider
      value={useMemo(
        () => ({ session, ready, setSession }),
        [session, ready, setSession],
      )}
    >
      {children}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
