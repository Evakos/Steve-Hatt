import "server-only";
import { get } from "@vercel/edge-config";
import { hasUpcomingChristmasDates } from "./christmas-dates";

/**
 * Whether Christmas pre-ordering is currently being offered site-wide — staff flip this via a
 * Vercel Edge Config item so it takes effect instantly, no redeploy (see /admin for how to flip
 * it until a write-capable admin button exists — see EDGE_CONFIG in .env.example). Defaults to
 * off if Edge Config isn't reachable (e.g. local dev without EDGE_CONFIG set) rather than
 * failing the page.
 *
 * The switch is ANDed with whether Christmas fulfilment dates (20th–24th Dec) still exist —
 * that's only ever false after this December's window has closed (Christmas Eve onward), so the
 * option is never presented with no bookable dates behind it.
 */
export async function isChristmasShopActive(): Promise<boolean> {
  if (!hasUpcomingChristmasDates()) return false;
  try {
    return (await get("christmasShopActive")) === true;
  } catch {
    return false;
  }
}
