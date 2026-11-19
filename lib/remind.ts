import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { saveSaleReminder } from "./api";
import { turnOnSaleAlerts } from "./push";
import { useSession } from "./session";
import type { PresaleDate } from "./types";

/** Shared Remind me behaviour for presale lists and sale screens. */
export function useReminders() {
  const { session } = useSession();
  const [saved, setSaved] = useState<Record<string, "saving" | "on">>({});
  const remind = async (date: PresaleDate) => {
    if (!session) {
      Alert.alert("Sign in to get reminders", "We'll remind you the day before and right before the queue opens.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/auth") },
      ]);
      return;
    }
    setSaved((v) => ({ ...v, [date.id]: "saving" }));
    try {
      await saveSaleReminder(date, session.token);
      setSaved((v) => ({ ...v, [date.id]: "on" }));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      // Ask for notifications at the moment they matter; email reminders work either way.
      void turnOnSaleAlerts(session.token).catch(() => undefined);
    } catch (x) {
      setSaved((v) => {
        const next = { ...v };
        delete next[date.id];
        return next;
      });
      Alert.alert("Reminder not saved", x instanceof Error ? x.message : "Try again in a moment.");
    }
  };
  return { saved, remind };
}
