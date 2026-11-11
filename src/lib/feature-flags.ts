import "server-only";
import { get } from "@vercel/edge-config";
import { hasUpcomingChristmasDates } from "./christmas-dates";
import { currentDate, isChristmasSeason, isOnlineOrderingClosed } from "./ordering-window";

/** Staff-set reopen date (YYYY-MM-DD, a January day) from Edge Config, or "" to use the default
 * 4th January. Only honoured in its own year, see ordering-window.ts. */
export async function getOrdersReopenDate(): Promise<string> {
  try {
    const value = await get("ordersReopenDate");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

/** Whether online ordering is closed right now: the automatic Christmas break (18th December to
 * the reopen day), honouring a staff-set reopen date. Use this on the server, not the sync helper. */
export async function areOnlineOrdersClosed(): Promise<boolean> {
  return isOnlineOrderingClosed(currentDate(), await getOrdersReopenDate());
}

/**
 * Whether Christmas pre-ordering is currently being offered site-wide - staff flip this via a
 * Vercel Edge Config item so it takes effect instantly, no redeploy (see /admin for how to flip
 * it until a write-capable admin button exists - see EDGE_CONFIG in .env.example). Defaults to
 * off if Edge Config isn't reachable (e.g. local dev without EDGE_CONFIG set) rather than
 * failing the page.
 *
 * The switch is ANDed with whether Christmas fulfilment dates (20th-24th Dec) still exist -
 * that's only ever false after this December's window has closed (Christmas Eve onward), so the
 * option is never presented with no bookable dates behind it.
 */
export async function isChristmasShopActive(): Promise<boolean> {
  // Christmas ordering only exists from 1st October to 17th December (see ordering-window.ts), so
  // the switch can be left on after the season: it closes itself after the 17th and stays off
  // through January, when next year's dates would otherwise count as "upcoming".
  const now = currentDate();
  if (!isChristmasSeason(now) || !hasUpcomingChristmasDates(now)) return false;
  return getChristmasShopActiveRaw();
}

/** The stored switch value with no date-gating applied - used by the admin settings panel so
 * staff see exactly what they've set (e.g. flipped on in October), not the customer-facing
 * derived availability, which is only ever false in the dead week between Christmas Eve and New
 * Year once this December's dates have passed. Everywhere else should use isChristmasShopActive. */
export async function getChristmasShopActiveRaw(): Promise<boolean> {
  try {
    return (await get("christmasShopActive")) === true;
  } catch {
    return false;
  }
}

/**
 * Seasonal percentage premium applied to Christmas orders only, on top of a product's normal
 * price - the deliberate alternative to giving products a separate "Christmas price" (which
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

/**
 * Fixed deposit (£) captured at checkout on a Christmas pre-order - Carole's preferred model: pay
 * a lump sum up front (so the shop isn't exposed to the November→December card-expiry risk on the
 * whole order), verify the card for the outstanding balance, and settle that balance on collection.
 * Staff-set via /admin/guide, same Edge Config mechanism as isChristmasShopActive, editable without
 * a redeploy. Returns 0 (off) if unset or unreachable; callers cap it at the estimated order total.
 */
export async function getChristmasDepositAmount(): Promise<number> {
  try {
    const value = await get("christmasDepositAmount");
    return typeof value === "number" && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Whether the legacy Christmas *deposit/part-payment* flow is in use, as opposed to the default
 * full-payment-upfront flow. Christmas pre-orders placed in full-upfront mode are charged in full
 * at checkout (see src/app/api/checkout/route.ts) - no hold, no later capture, no balance, no
 * refund - so they skip the scheduled hold (src/app/api/cron/reauthorise-preorders), the /admin
 * orders capture queue, and the balance/refund maths in /api/admin/capture entirely. Staff only
 * flip this on via /admin/products if they specifically want the older "deposit now, settle the
 * balance later" model for a season - it's an escape hatch, never the default. Defaults to false.
 */
export async function getChristmasUseDepositFlow(): Promise<boolean> {
  try {
    return (await get("christmasUseDepositFlow")) === true;
  } catch {
    return false;
  }
}
