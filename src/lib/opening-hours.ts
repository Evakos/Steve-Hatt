/**
 * The shop's opening hours by date, edited in the admin under Messages and hours. They drive three things so they can never
 * disagree: the opening hours card on the home page, which dates can be booked (a closed day is never offered), and the
 * collection hours shown for each date. A day that closes earlier than usual also gets a note on its orders automatically.
 * Plain functions with no server-only imports, so the checkout page and the server both use them.
 */
export interface OpeningDay {
  /** YYYY-MM-DD */
  date: string;
  closed: boolean;
  /** HH:MM, 24 hour. Ignored when closed. */
  opens: string;
  closes: string;
}

export interface OpeningHours {
  title: string;
  /** A line above the days for the normal stretch, e.g. "Tuesday 15th to Saturday 19th December: opening hours as usual". */
  intro: string;
  footnote: string;
  days: OpeningDay[];
}

/** The usual closing time: a day that closes before this is an early close. */
export const USUAL_CLOSING = "17:00";

/** "08:00" as "8am", "14:30" as "2:30pm". */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/** The dates the shop is closed (YYYY-MM-DD). These are never offered for booking. */
export function closedDateKeys(days: readonly OpeningDay[]): string[] {
  return days.filter((d) => d.closed).map((d) => d.date);
}

/** The day's opening hours if the shop is open that day and they are set, else undefined. */
export function openingFor(dateKey: string, days: readonly OpeningDay[]): OpeningDay | undefined {
  return days.find((d) => d.date === dateKey && !d.closed);
}

/** Collection hours for a date as "8am-7pm", or null when the day has none set (the usual hours apply). */
export function collectionTimeFor(dateKey: string, days: readonly OpeningDay[]): string | null {
  const day = openingFor(dateKey, days);
  return day ? `${formatClock(day.opens)}-${formatClock(day.closes)}` : null;
}

const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const atNoon = (key: string) => new Date(`${key}T12:00:00Z`);

/** A date as people say it: "Christmas Eve", or "Thursday 24 December". */
export function dayName(dateKey: string): string {
  const md = dateKey.slice(5);
  if (md === "12-24") return "Christmas Eve";
  if (md === "12-31") return "New Year's Eve";
  return longDate.format(atNoon(dateKey));
}

/** A closed date for the "Closed" card: "Christmas Day", "Boxing Day", "New Year's Day", else "Sun 20 Dec". */
export function closedName(dateKey: string): string {
  const md = dateKey.slice(5);
  if (md === "12-25") return "Christmas Day";
  if (md === "12-26") return "Boxing Day";
  if (md === "01-01") return "New Year's Day";
  return shortDate.format(atNoon(dateKey));
}

/** The note an order for this date should carry because the shop closes early that day, or null. */
export function earlyCloseNote(dateKey: string, days: readonly OpeningDay[]): string | null {
  const day = openingFor(dateKey, days);
  if (!day || day.closes >= USUAL_CLOSING) return null;
  return `Please note: we close early on ${dayName(dateKey)}, at ${formatClock(day.closes)}.`;
}
