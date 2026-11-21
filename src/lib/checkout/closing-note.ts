import { slotDateKey } from "@/lib/slots";

/** A note staff attach to a date (for example an early closing time), set in the admin under Messages and hours. */
export interface DateNote {
  /** YYYY-MM-DD */
  date: string;
  note: string;
}

/** The note for an order booked on this date (an ISO string), or null when that date has none. */
export function dayNoteFor(slotDate: string | null | undefined, notes: readonly DateNote[]): string | null {
  if (!slotDate) return null;
  const date = new Date(slotDate);
  if (Number.isNaN(date.getTime())) return null;
  const key = slotDateKey(date);
  return notes.find((n) => n.date === key)?.note ?? null;
}
