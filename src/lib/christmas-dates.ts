/**
 * Christmas pre-order fulfilment dates.
 *
 * Business rules (see memory): Christmas pre-orders are exposed by the site-wide admin switch
 * (see lib/feature-flags.ts); fulfilment is on 20th–24th December, and the shop is closed Sun &
 * Mon — so only Tue–Sat dates are bookable. Both the server-side feature flag and the client
 * checkout derive availability from these helpers so Christmas mode is never offered with no
 * dates behind it.
 */

/** True when `date` falls on Tue–Sat (the shop is closed Sun & Mon). */
export function isTueToSat(date: Date): boolean {
  const day = date.getDay();
  return day >= 2 && day <= 6;
}

/** True when `date` is one of the Christmas fulfilment dates (20th–24th December). */
export function isChristmasFulfilmentDate(date: Date): boolean {
  return date.getMonth() === 11 && date.getDate() >= 20 && date.getDate() <= 24;
}

/**
 * Upcoming Christmas fulfilment dates — 20th–24th December of the current year, Tue–Sat, strictly
 * in the future. No calendar gate: whenever the admin switch is on, these dates exist to be booked
 * (so the flow can be run/tested outside the November–December season). Once this December's
 * window has passed (Christmas Eve onward) it returns an empty array, and the next year's window
 * is picked up automatically from 1st January.
 */
export function getUpcomingChristmasDates(from: Date = new Date()): Date[] {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);

  const christmasYear = today.getFullYear();
  return [20, 21, 22, 23, 24]
    .map((day) => new Date(christmasYear, 11, day))
    .filter((d) => isTueToSat(d) && d > today);
}

/** Whether any Christmas fulfilment date is currently bookable. */
export function hasUpcomingChristmasDates(from: Date = new Date()): boolean {
  return getUpcomingChristmasDates(from).length > 0;
}
