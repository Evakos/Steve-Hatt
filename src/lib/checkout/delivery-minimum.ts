/** The smallest basket (before the £5 delivery fee) that can be delivered. Collection has no minimum. */
export const DELIVERY_MINIMUM = 20;

/** How much more must be added to reach the delivery minimum, in pounds. 0 when it is met, or for collection. */
export function deliveryShortfall(subtotal: number, fulfilmentType: "delivery" | "collection"): number {
  if (fulfilmentType !== "delivery") return 0;
  return Math.max(0, Math.round((DELIVERY_MINIMUM - subtotal) * 100) / 100);
}

/** The message shown to a customer whose delivery basket is under the minimum. */
export function deliveryMinimumMessage(shortfall: number): string {
  return `Delivery orders have a minimum of £${DELIVERY_MINIMUM}. Add £${shortfall.toFixed(2)} more, or choose collection.`;
}
