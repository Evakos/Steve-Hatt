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

/** First day (January) of the break's end used for fulfilment slots: the shop prepares no orders from
 * 25th December to 3rd January, so no everyday slot is offered then. Not the online ordering dates. */
export const REOPEN_DAY = 4;

/** Shown in the banner and refused-order message while ordering is closed, with the reopening date when one is set. */
export function ordersClosedReason(reopenLabel?: string | null, template?: string | null): string {
  // Wording staff wrote in the admin wins; {reopen} stands for the reopening day.
  if (template && template.trim()) return template.replace(/\{reopen\}/g, reopenLabel ?? "the New Year");
  const until = reopenLabel ? `The shop will be closed until ${reopenLabel}.` : "The shop is closed for the Christmas break.";
  return `${until} During this period orders cannot be made due to staff holidays and fish supplies.`;
}

/** Christmas pre-ordering can only be live from this month (0-based, so 9 = October). This is not a date
 * staff see, just a guard so a Christmas switch left on can never bring it back in the spring. The real
 * dates (first day, last day, reopening) are set in the admin and have no defaults. */
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

/** The December day a staff-set last-order date (YYYY-12-DD) points to, or null if it is blank,
 * malformed, for a different year, or after the 24th - so last year's date can never linger. */
function lastOrderDayFor(lastOrderDate: string | null | undefined, year: number): number | null {
  const m = /^(\d{4})-12-(\d{2})$/.exec(lastOrderDate ?? "");
  if (!m || Number(m[1]) !== year) return null;
  const day = Number(m[2]);
  return day >= 1 && day <= 24 ? day : null;
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** The last order day for showing to customers, e.g. "16th December", or null when none is set. */
export function lastOrderLabelFor(lastOrderDate?: string | null, now: Date = currentDate()): string | null {
  const { year } = ukDateParts(now);
  const day = lastOrderDayFor(lastOrderDate, year);
  return day === null ? null : `${ordinal(day)} December`;
}

/** The (month, day) a staff-set opening date (YYYY-MM-DD) points to in `year`, or null. */
function openingFor(openDate: string | null | undefined, year: number): { month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(openDate ?? "");
  if (!m || Number(m[1]) !== year) return null;
  return { month: Number(m[2]) - 1, day: Number(m[3]) };
}

/**
 * True when no online orders can be placed: from the day after the staff-set last order day (December)
 * until the staff-set reopening day (January). There are no default dates. With no last order day set
 * there is no closure, and once one is set the shop stays closed until a reopening date is set.
 */
export function isOnlineOrderingClosed(from: Date = currentDate(), reopenDate?: string | null, lastOrderDate?: string | null): boolean {
  const { year, month, day } = ukDateParts(from);
  if (month === 11) {
    const last = lastOrderDayFor(lastOrderDate, year);
    return last !== null && day > last;
  }
  if (month === 0) {
    if (lastOrderDayFor(lastOrderDate, year - 1) === null) return false;
    const reopen = reopenDayFor(reopenDate, year);
    return reopen === null ? true : day < reopen;
  }
  return false;
}

/**
 * True while Christmas pre-ordering can be live: from the staff-set first day (if there is one) to the
 * staff-set last order day (if there is one), never before October or after Christmas Eve. There are no
 * default dates, so with none set the Christmas switch alone decides.
 */
export function isChristmasSeason(from: Date = currentDate(), lastOrderDate?: string | null, openDate?: string | null): boolean {
  const { year, month, day } = ukDateParts(from);
  if (month < CHRISTMAS_SEASON_START_MONTH) return false;
  if (month === 11 && day > 24) return false;
  const opening = openingFor(openDate, year);
  if (opening && (month < opening.month || (month === opening.month && day < opening.day))) return false;
  if (month === 11) {
    const last = lastOrderDayFor(lastOrderDate, year);
    if (last !== null && day > last) return false;
  }
  return true;
}

/** True for fulfilment dates inside the Christmas break (25th December to 3rd January) - the shop
 * is not preparing orders then, so no everyday slot is offered on those days. */
export function isInChristmasBreak(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day >= 25) || (month === 0 && day < REOPEN_DAY);
}

/** The day ordering closes, e.g. "18th December" when the last order day is the 17th. Null when none is set. */
export function closingLabelFor(lastOrderDate?: string | null, now: Date = currentDate()): string | null {
  const { year } = ukDateParts(now);
  const day = lastOrderDayFor(lastOrderDate, year);
  return day === null ? null : `${ordinal(day + 1)} December`;
}

/** The staff-set reopening day, e.g. "5th January", or null when none is set. Read in December it points to next January. */
export function reopenLabelFor(reopenDate?: string | null, now: Date = currentDate()): string | null {
  const { year, month } = ukDateParts(now);
  const day = reopenDayFor(reopenDate, month === 11 ? year + 1 : year);
  return day === null ? null : `${ordinal(day)} January`;
}
