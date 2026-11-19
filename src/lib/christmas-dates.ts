/**
 * Christmas pre-order fulfilment dates.
 *
 * Business rules (see memory): Christmas pre-orders are exposed by the site-wide admin switch
 * (see lib/feature-flags.ts); fulfilment is on 20th-24th December, and the shop is closed Sun &
 * Mon - so only Tue-Sat dates are bookable. Both the server-side feature flag and the client
 * checkout derive availability from these helpers so Christmas mode is never offered with no
 * dates behind it.
 */

/** True when `date` falls on Tue-Sat (the shop is closed Sun & Mon). */
export function isTueToSat(date: Date): boolean {
  const day = date.getDay();
  return day >= 2 && day <= 6;
}

/**
 * The Christmas delivery and collection days staff have picked in the admin, as YYYY-MM-DD strings.
 * There are no default days: with none picked there are no Christmas dates and Christmas ordering is
 * not offered. Every helper below takes this list. Only when it is left out (the unit tests) does the
 * old fixed rule apply: 20th-24th December, Tuesday to Saturday.
 */
export type ChristmasDays = readonly string[];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A local date as YYYY-MM-DD. */
function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** A YYYY-MM-DD string as a local midnight date, or null if it isn't one. */
function parseIsoDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** True when `date` is one of the Christmas fulfilment days. */
export function isChristmasFulfilmentDate(date: Date, days?: ChristmasDays): boolean {
  if (days) return days.includes(isoDay(date));
  return date.getMonth() === 11 && date.getDate() >= 20 && date.getDate() <= 24;
}

/**
 * Upcoming Christmas fulfilment dates: the days staff picked, strictly in the future, in date order.
 * No calendar gate: whenever the admin switch is on and days are picked, these exist to be booked.
 * Once the last picked day has passed this returns an empty array.
 */
export function getUpcomingChristmasDates(from: Date = new Date(), days?: ChristmasDays): Date[] {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  if (days) {
    return days
      .map(parseIsoDay)
      .filter((d): d is Date => d !== null && d > today)
      .sort((a, b) => a.getTime() - b.getTime());
  }
  const christmasYear = today.getFullYear();
  return [20, 21, 22, 23, 24]
    .map((day) => new Date(christmasYear, 11, day))
    .filter((d) => isTueToSat(d) && d > today);
}

/** Whether any Christmas fulfilment date is currently bookable. */
export function hasUpcomingChristmasDates(from: Date = new Date(), days?: ChristmasDays): boolean {
  return getUpcomingChristmasDates(from, days).length > 0;
}
