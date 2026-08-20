import "server-only";
import { wooFetch } from "./client";
import type { WooOrder, WooOrderInput } from "./types";

export async function createWooOrder(input: WooOrderInput): Promise<WooOrder> {
  return wooFetch<WooOrder>("orders", { method: "POST", body: input });
}

/**
 * Best-effort lookup used by the Pay360 webhook to avoid double-creating an order if the
 * client's /api/checkout/confirm round-trip already succeeded. WooCommerce's REST API doesn't
 * offer a guaranteed exact-match filter on the free-text `transaction_id` field, so this is a
 * search, not a precise query - see master plan Phase C3 for the known reconciliation gap.
 */
export async function findOrderByTransactionId(transactionId: string): Promise<WooOrder | undefined> {
  const matches = await wooFetch<WooOrder[]>("orders", {
    searchParams: { search: transactionId, per_page: 1 },
    next: { revalidate: 0 },
  });
  return matches[0];
}

/** Orders authorised but not yet captured - the /admin/orders queue. "on-hold" is only ever
 * used by this app for that meaning (see create-order-from-payment.ts), so status alone is a
 * reliable filter without needing to also check the _cardstream_capture_status meta. */
export async function listPendingCaptureOrders(): Promise<WooOrder[]> {
  return wooFetch<WooOrder[]>("orders", {
    searchParams: { status: "on-hold", per_page: 50, orderby: "date", order: "asc" },
    next: { revalidate: 0 },
  });
}

/** Christmas pre-orders whose card has been verified (see create-preorder-from-verification.ts)
 * but not yet re-authorised close to the delivery date - the cron reauthorisation job's queue
 * (src/app/api/cron/reauthorise-preorders/route.ts), also shown read-only on /admin/orders.
 * "pending" (WooCommerce's own "order received, no payment yet" status) is only ever used by
 * this app for that meaning, so status alone is a reliable filter - same pattern as
 * listPendingCaptureOrders. */
export async function listPendingPreOrders(): Promise<WooOrder[]> {
  return wooFetch<WooOrder[]>("orders", {
    searchParams: { status: "pending", per_page: 50, orderby: "date", order: "asc" },
    next: { revalidate: 0 },
  });
}

/** Orders captured/charged but not yet marked complete - the second /admin/orders queue.
 * "processing" is only ever used by this app for that meaning (see
 * src/app/api/admin/capture/route.ts), so status alone is a reliable filter. */
export async function listProcessingOrders(): Promise<WooOrder[]> {
  return wooFetch<WooOrder[]>("orders", {
    searchParams: { status: "processing", per_page: 50, orderby: "date", order: "asc" },
    next: { revalidate: 0 },
  });
}

export async function getWooOrder(id: number): Promise<WooOrder> {
  return wooFetch<WooOrder>(`orders/${id}`, { next: { revalidate: 0 } });
}

export async function updateWooOrder(id: number, input: WooOrderInput): Promise<WooOrder> {
  return wooFetch<WooOrder>(`orders/${id}`, { method: "PUT", body: input });
}

/** Order history shown on /account - only orders placed while signed in (guest checkout orders
 * have no customer_id, so they never show up here). */
export async function listCustomerOrders(customerId: number): Promise<WooOrder[]> {
  return wooFetch<WooOrder[]>("orders", {
    searchParams: { customer: customerId, per_page: 50, orderby: "date", order: "desc" },
    next: { revalidate: 0 },
  });
}
