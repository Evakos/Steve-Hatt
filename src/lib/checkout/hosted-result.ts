/** What the card-entry frame reports back to the checkout page once the customer has finished. */
export type HostedResult =
  | { status: "paid"; orderId: number; orderNumber: string; estimatedTotal: number }
  | { status: "failed"; reason: string };

/** Marks the postMessage that carries a HostedResult from the frame's return page up to the checkout page. */
export const HOSTED_MESSAGE_SOURCE = "steve-hatt-hosted-payment";
