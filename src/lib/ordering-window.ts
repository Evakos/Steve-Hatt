/**
 * Christmas closing window for online ordering.
 *
 * Carole's rule (11 Nov 2026): all pre-orders stop after 17th December, and there are no further
 * online orders until the new year (last year the shop stopped internet orders until it reopened).
 * Tony's note puts the break at "between Christmas and the 3rd of January". While closed, the site
 * shows a banner with the reason, add-to-cart and checkout are blocked, and the order API refuses.
 *
 * Plain date maths on purpose (no server-only imports) so the checkout page, the API routes and
 * the feature-flag helper all share the one definition. Vercel runs in UTC, which matches UK time
 * in December and January.
 */

/** Last day (December) on which an online order can be placed. */
export const LAST_ORDER_DAY = 17;
/** First day (January) on which online ordering is open again. */
export const REOPEN_DAY = 4;

export const LAST_ORDER_LABEL = "17th December";

/** Shown in the banner and refused-order message while ordering is closed. */
export const ORDERS_CLOSED_REASON =
  "Online ordering is closed for the Christmas break, due to the shortage of fish and staff holidays. We will take orders again in the new year.";

/** First month (0-based, so 9 = October) in which Christmas pre-ordering can be live. Before this
 * the Christmas switch is ignored, so it can never be left on and reappear in January. */
export const CHRISTMAS_SEASON_START_MONTH = 9;

/**
 * The current moment, or the date in ORDERING_SIMULATE_DATE (YYYY-MM-DD) so the closing window can
 * be previewed without waiting for December. Ignored on the live production deployment, so it can
 * never close or open the real shop by accident. Server-side only (the client reads the result
 * through /api/feature-flags/christmas).
 */
export function currentDate(): Date {
  const simulated = process.env.ORDERING_SIMULATE_DATE;
  if (simulated && process.env.VERCEL_ENV !== "production") {
    const d = new Date(`${simulated}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Year, month (0-based) and day of month in UK time, whatever timezone the server runs in. */
function ukDateParts(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const num = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: num("year"), month: num("month") - 1, day: num("day") };
}

/** The January day a staff-set reopen date (YYYY-MM-DD) points to, or null if it is blank,
 * malformed, or for a different year - so last year's date can never linger into the next break. */
function reopenDayFor(reopenDate: string | null | undefined, year: number): number | null {
  const m = /^(\d{4})-01-(\d{2})$/.exec(reopenDate ?? "");
  if (!m || Number(m[1]) !== year) return null;
  const day = Number(m[2]);
  return day >= 1 && day <= 31 ? day : null;
}

/** True from 18th December until the reopen day (3rd January inclusive by default) - no online
 * orders can be placed. It closes and reopens by itself every year: orders open again from 4th
 * January (UK time) unless staff set a different January `reopenDate` in the admin. */
export function isOnlineOrderingClosed(from: Date = currentDate(), reopenDate?: string | null): boolean {
  const { year, month, day } = ukDateParts(from);
  if (month === 11) return day > LAST_ORDER_DAY;
  if (month === 0) return day < (reopenDayFor(reopenDate, year) ?? REOPEN_DAY);
  return false;
}

/** True from 1st October to 17th December (UK time) - the only stretch in which Christmas
 * pre-ordering can be live. Outside it the Christmas switch has no effect. */
export function isChristmasSeason(from: Date = currentDate()): boolean {
  const { month, day } = ukDateParts(from);
  return (month >= CHRISTMAS_SEASON_START_MONTH && month <= 10) || (month === 11 && day <= LAST_ORDER_DAY);
}

/** True for fulfilment dates inside the Christmas break (25th December to 3rd January) - the shop
 * is not preparing orders then, so no everyday slot is offered on those days. */
export function isInChristmasBreak(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day >= 25) || (month === 0 && day < REOPEN_DAY);
}
