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

/**
 * The shop's usual hours for a date, by weekday, as in the footer: Tuesday to Friday 8am to 7pm, Saturday 7am to 5pm, closed
 * Sunday and Monday. Null on a day that is closed as usual.
 */
export function usualHoursFor(dateKey: string): { opens: string; closes: string } | null {
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay(); // 0 Sunday ... 6 Saturday
  if (weekday >= 2 && weekday <= 5) return { opens: "08:00", closes: "19:00" };
  if (weekday === 6) return { opens: "07:00", closes: "17:00" };
  return null;
}

/** Collection hours for a date as "8am-7pm": the hours set for that date, else the usual hours. Null when closed. */
export function collectionTimeFor(dateKey: string, days: readonly OpeningDay[]): string | null {
  const listed = days.find((d) => d.date === dateKey);
  if (listed) return listed.closed ? null : `${formatClock(listed.opens)}-${formatClock(listed.closes)}`;
  const usual = usualHoursFor(dateKey);
  return usual ? `${formatClock(usual.opens)}-${formatClock(usual.closes)}` : null;
}

/** The occasion a date is known for, if any, e.g. "Christmas Eve". */
export function occasionName(dateKey: string): string | null {
  const names: Record<string, string> = {
    "12-24": "Christmas Eve",
    "12-25": "Christmas Day",
    "12-26": "Boxing Day",
    "12-31": "New Year's Eve",
    "01-01": "New Year's Day",
  };
  return names[dateKey.slice(5)] ?? null;
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
