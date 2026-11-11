import { getUpcomingChristmasDates, isTueToSat } from "./christmas-dates";
import { isInChristmasBreak } from "./ordering-window";

/**
 * Delivery and collection time slots. Each bookable date offers the same three windows; staff can
 * switch any single date + window on or off in /admin/slots, stored in Edge Config as a list of
 * keys like "2026-12-20|delivery-am". Plain functions only (no server-only imports) so the
 * checkout page, the checkout API and the admin grid all share one definition.
 */

export type SlotWindowId = "delivery-am" | "delivery-pm" | "collection";

export interface SlotWindow {
  id: SlotWindowId;
  type: "delivery" | "collection";
  name: string;
  time: string;
}

export const SLOT_WINDOWS: SlotWindow[] = [
  { id: "delivery-am", type: "delivery", name: "Morning", time: "9am-12pm" },
  { id: "delivery-pm", type: "delivery", name: "Afternoon", time: "12pm-5pm" },
  { id: "collection", type: "collection", name: "Collection", time: "7am-5pm" },
];

/** What a stored key must look like: YYYY-MM-DD|window-id. */
export const SLOT_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}\|(delivery-am|delivery-pm|collection)$/;

const UK_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of a date in UK time, however the Date was built (browser or server). */
export function slotDateKey(date: Date): string {
  return UK_DAY.format(date);
}

export function slotKey(date: Date, windowId: SlotWindowId): string {
  return `${slotDateKey(date)}|${windowId}`;
}

export function isSlotDisabled(disabled: readonly string[], date: Date, windowId: SlotWindowId): boolean {
  if (disabled.length === 0 || Number.isNaN(date.getTime())) return false;
  return disabled.includes(slotKey(date, windowId));
}

/** Works out which window a booked slot belongs to from its label ("... · Morning (9am-12pm)"),
 * for the server-side check at checkout. Null if it can't be told. */
export function slotWindowFromLabel(label: string, type: "delivery" | "collection"): SlotWindowId | null {
  if (type === "collection") return "collection";
  if (label.includes("Morning")) return "delivery-am";
  if (label.includes("Afternoon")) return "delivery-pm";
  return null;
}

/** Dates on which slots can be offered: the next 21 days (Tue-Sat, outside the Christmas break)
 * plus any upcoming Christmas fulfilment dates (20th-24th December), in date order. */
export function getAvailableDates(from: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    // No everyday slots inside the Christmas break (25th December to 3rd January).
    if (isTueToSat(d) && !isInChristmasBreak(d)) {
      dates.push(d);
    }
  }

  // Christmas pre-order dates (Dec 20-24), de-duped against the 21-day window above for the
  // late-November/December overlap.
  for (const d of getUpcomingChristmasDates(from)) {
    if (!dates.some((existing) => existing.getTime() === d.getTime())) {
      dates.push(d);
    }
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}
