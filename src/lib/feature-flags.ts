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

/**
 * Seasonal percentage premium applied to Christmas orders only, on top of a product's normal
 * price — the deliberate alternative to giving products a separate "Christmas price" (which
 * would mean duplicate listings, effectively two shops sharing one catalogue). Never shown on
 * the shop/product pages, applied only at checkout once a customer has chosen a Christmas order
 * (see repriceCheckoutRequest), and disclosed there rather than as a second price tag anywhere
 * in the catalogue. Same Edge Config mechanism as isChristmasShopActive, editable without a
 * redeploy since the market rate driving this changes year to year. Defaults to 0 (no premium)
 * if unset or unreachable.
 */
export async function getChristmasPremiumPercent(): Promise<number> {
  try {
    const value = await get("christmasPremiumPercent");
    return typeof value === "number" && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}
