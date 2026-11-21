import { slotDateKey } from "@/lib/slots";
import { collectionTimeFor, dayName, earlyCloseNote, type OpeningDay } from "@/lib/opening-hours";

/** A note staff attach to a date (for example an early closing time), set in the admin under Messages and hours. */
export interface DateNote {
  /** YYYY-MM-DD */
  date: string;
  note: string;
}

/** The note for an order booked on this date (an ISO string), or null when that date has none. */
export function dayNoteFor(
  slotDate: string | null | undefined,
  notes: readonly DateNote[],
  openingDays: readonly OpeningDay[] = []
): string | null {
  if (!slotDate) return null;
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return null;
  const key = slotDateKey(date);
  // A note staff wrote for the date wins; otherwise a day that closes early carries a note automatically.
  return notes.find((n) => n.date === key)?.note ?? earlyCloseNote(key, openingDays);
}

/** "Opening hours on Monday 21 December: 8am to 7pm." for the booked date, or null when the opening hours don't set that day. */
export function hoursLineFor(slotDate: string | null | undefined, openingDays: readonly OpeningDay[]): string | null {
  if (!slotDate) return null;
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return null;
  const key = slotDateKey(date);
  const time = collectionTimeFor(key, openingDays);
  return time ? `Opening hours on ${dayName(key)}: ${time.replace("-", " to ")}.` : null;
}
