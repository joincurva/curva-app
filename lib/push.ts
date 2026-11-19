import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { request } from "./api";

export type PushResult =
  | { status: "on"; token: string }
  | { status: "denied" | "unavailable" | "error"; message: string };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId() {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Asks for permission and registers this iPhone for sale alerts. Email reminders keep working either way. */
export async function turnOnSaleAlerts(sessionToken: string): Promise<PushResult> {
  if (!Device.isDevice)
    return { status: "unavailable", message: "Alerts only work on a real iPhone." };
  const id = projectId();
  if (!id)
    return { status: "unavailable", message: "Alerts aren't available in this test build yet." };
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted")
    return {
      status: "denied",
      message: "Notifications are off for Curva. Turn them on in Settings > Curva > Notifications. Email reminders still work.",
    };
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await request(
      "/api/mobile/push-token",
      { method: "POST", body: JSON.stringify({ token, platform: Platform.OS === "android" ? "android" : "ios" }) },
      sessionToken,
    );
    return { status: "on", token };
  } catch (x) {
    return { status: "error", message: x instanceof Error ? x.message : "Alerts could not be turned on. Try again." };
  }
}

/** Stops alerts on this device (or every device when no token is known). */
export async function turnOffSaleAlerts(sessionToken: string, token?: string) {
  await request(
    "/api/mobile/push-token",
    { method: "DELETE", body: JSON.stringify(token ? { token } : {}) },
    sessionToken,
  );
}
