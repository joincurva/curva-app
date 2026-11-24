import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";

const KEY = "curva.review.lastAsked";
const GAP_MS = 120 * 24 * 60 * 60 * 1000; // at most once every ~4 months; Apple also caps it at 3 a year

/**
 * Asks for an App Store rating with Apple's own prompt, only after a good moment
 * (a fan got tickets, or has followed a few artists and teams). Never on first launch,
 * never more than once every few months, and never blocks or throws.
 */
export async function askForRatingAfterGoodMoment(delayMs = 1500) {
  try {
    const last = Number((await SecureStore.getItemAsync(KEY)) ?? 0);
    if (Date.now() - last < GAP_MS) return;
    if (!(await StoreReview.hasAction())) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await StoreReview.requestReview();
    await SecureStore.setItemAsync(KEY, String(Date.now()));
  } catch {
    // Rating prompts are optional; never interrupt the fan.
  }
}
