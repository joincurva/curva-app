import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { brand } from "./theme";

/** Only verified official ticket pages open from Curva. */
export function officialTicketUrl(raw?: string): URL | undefined {
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  if (!(url.hostname === "ticketmaster.com" || url.hostname.endsWith(".ticketmaster.com"))) return undefined;
  return url;
}

/**
 * Opens the official ticket page in a sheet inside Curva, not in another app.
 * Fans buy on the official seller and tap Done to land back where they were.
 */
export async function openOfficialTickets(raw?: string) {
  const url = officialTicketUrl(raw);
  if (!url) {
    Alert.alert("Official link unavailable", "Curva only opens verified official ticket pages, and this listing doesn't have one yet.");
    return false;
  }
  try {
    await WebBrowser.openBrowserAsync(url.toString(), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: brand.navy,
      toolbarColor: brand.navy,
      dismissButtonStyle: "done",
      readerMode: false,
      enableBarCollapsing: true,
    });
    return true;
  } catch {
    Alert.alert("Could not open the official page", "Check your connection and try again.");
    return false;
  }
}
