import { slotDateKey } from "@/lib/slots";

/** The shop closes early on Christmas Eve, so orders for that day carry a bold note about it. */
export const CHRISTMAS_EVE_NOTE = "Please note: we close early on Christmas Eve, at 2pm.";

/** The closing-time note for an order booked for this date (an ISO string), or null for any other day. */
export function closingNoteFor(slotDate?: string | null): string | null {
  if (!slotDate) return null;
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return null;
  return slotDateKey(date).slice(5) === "12-24" ? CHRISTMAS_EVE_NOTE : null;
}
