import { Alert } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { markGoing, type GoingInput } from "./api";
import { openOfficialTickets } from "./official";

/**
 * Opens the official page inside Curva. When the fan taps Done, ask whether they got tickets,
 * so the show lands in My Shows without them doing anything else.
 */
export async function buyThenAsk(event: GoingInput, token?: string) {
  const opened = await openOfficialTickets(event.officialUrl);
  if (!opened) return;
  if (!token) {
    Alert.alert("Got tickets?", "Sign in and Curva keeps your shows in one place, with a countdown and a show-day plan.", [
      { text: "Not now", style: "cancel" },
      { text: "Sign in", onPress: () => router.push("/auth") },
    ]);
    return;
  }
  Alert.alert("Did you get tickets?", event.name, [
    { text: "Not this time", style: "cancel" },
    {
      text: "Yes, I'm going",
      onPress: () =>
        void markGoing(event, token)
          .then(() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            Alert.alert("Added to My Shows", "We'll stop sale reminders for this one and get your show day ready.", [
              { text: "Done", style: "cancel" },
              { text: "Open My Shows", onPress: () => router.push("/(tabs)") },
            ]);
          })
          .catch((x) => Alert.alert("Couldn't save that", x instanceof Error ? x.message : "Try again in a moment.")),
    },
  ]);
}
