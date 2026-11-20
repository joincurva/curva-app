import { Alert, Linking } from "react-native";
import { calendarFeedToken } from "./api";

/** Subscribes the fan's iPhone Calendar to their Curva shows. It stays up to date on its own. */
export async function subscribeCalendar(sessionToken: string) {
  try {
    const { token } = await calendarFeedToken(sessionToken);
    await Linking.openURL(`webcal://joincurva.com/api/calendar-feed/${encodeURIComponent(token)}`);
  } catch {
    Alert.alert("Couldn't open Calendar", "Try again in a moment.");
  }
}
