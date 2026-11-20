import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { config } from "./config";

const KEY = "curva.install-id";

function uuid() {
  // Random v4 id. Anonymous: it isn't tied to the device, the fan or any advertising id.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Tells Curva the app was opened, so installs and returning fans can be counted. Never blocks the app. */
export async function reportAppOpen() {
  try {
    let installId = await SecureStore.getItemAsync(KEY);
    if (!installId) {
      installId = uuid();
      await SecureStore.setItemAsync(KEY, installId);
    }
    await fetch(`${config.apiUrl}/api/mobile/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        installId,
        platform: Platform.OS === "android" ? "android" : "ios",
        appVersion: Constants.expoConfig?.version,
      }),
    });
  } catch {
    // Counting opens is best effort.
  }
}
