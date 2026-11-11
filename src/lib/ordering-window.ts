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

/** True from 18th December until 3rd January inclusive - no online orders can be placed. */
export function isOnlineOrderingClosed(from: Date = new Date()): boolean {
  const month = from.getMonth();
  const day = from.getDate();
  return (month === 11 && day > LAST_ORDER_DAY) || (month === 0 && day < REOPEN_DAY);
}

/** True for fulfilment dates inside the Christmas break (25th December to 3rd January) - the shop
 * is not preparing orders then, so no everyday slot is offered on those days. */
export function isInChristmasBreak(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day >= 25) || (month === 0 && day < REOPEN_DAY);
}
