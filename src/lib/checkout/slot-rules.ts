import { getAvailableDates, slotDateKey } from "@/lib/slots";
import type { RepricedOrder } from "./reprice";

/**
 * Server-side rules for the date a customer has booked. The booked date alone decides whether an
 * order is a Christmas order (20th-24th December) and whether it can be booked at all; whatever
 * the browser says about "isChristmas" is ignored. That way a stale page, a second tab or an
 * altered request can never get Christmas prices or the Christmas flow on a normal date, or
 * normal prices on a Christmas one.
 */

const NOT_AVAILABLE = "Sorry, that date is no longer available. Please go back and choose another.";
const CHRISTMAS_CLOSED = "Christmas orders aren't open right now. Please go back and choose another date.";

/** True when the booked date is 20th-24th December (UK date). False for anything unreadable. */
export function isChristmasSlotDate(slotDate: string): boolean {
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return false;
  const [, month, day] = slotDateKey(date).split("-").map(Number);
  return month === 12 && day >= 20 && day <= 24;
}

export type BookedSlotCheck = { ok: true; isChristmas: boolean } | { ok: false; reason: string };

/** Whether the date can be booked right now: one of the days the checkout offers (Tue-Sat, next
 * 21 days, outside the Christmas break, plus the upcoming Christmas dates), and a Christmas date
 * only while the Christmas shop is switched on. */
export function checkBookedSlot(slotDate: string, options: { christmasShopActive: boolean; now?: Date }): BookedSlotCheck {
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return { ok: false, reason: NOT_AVAILABLE };
  const key = slotDateKey(date);
  if (!getAvailableDates(options.now).some((d) => slotDateKey(d) === key)) return { ok: false, reason: NOT_AVAILABLE };
  const isChristmas = isChristmasSlotDate(slotDate);
  if (isChristmas && !options.christmasShopActive) return { ok: false, reason: CHRISTMAS_CLOSED };
  return { ok: true, isChristmas };
}

/** A message if a Christmas-date order contains a product that is opted out of Christmas, else null. */
export function christmasExclusionReason(repriced: Pick<RepricedOrder, "isChristmas" | "lineItems">): string | null {
  if (!repriced.isChristmas) return null;
  const names = repriced.lineItems.filter((li) => li.excludedFromChristmas).map((li) => li.productName);
  if (names.length === 0) return null;
  const many = names.length > 1;
  return `${names.join(", ")} ${many ? "aren't" : "isn't"} available for Christmas dates. Please remove ${many ? "them" : "it"} or choose a different date.`;
}
