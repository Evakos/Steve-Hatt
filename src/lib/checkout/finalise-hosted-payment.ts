import "server-only";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { sendAdminNewOrderNotification, sendOrderConfirmation } from "@/lib/email/send-order-confirmation";
import { getWooOrder, updateWooOrder } from "@/lib/woocommerce/orders";
import type { WooOrder } from "@/lib/woocommerce/types";
import { adminDeliveryFields } from "./delivery-address";
import type { HostedResult } from "./hosted-result";
import { repriceCheckoutRequest } from "./reprice";
import { checkoutRequestSchema } from "./schema";

export type FinaliseOutcome = HostedResult | { status: "pending" };

export function readMeta(order: WooOrder, key: string): string {
  const value = order.meta_data.find((m) => m.key === key)?.value;
  return typeof value === "string" ? value : "";
}

/**
 * Turns an order that is waiting for payment (created by /api/checkout/session) into a paid one,
 * but only after asking Pay360 directly whether the payment really went through. The return URL
 * and anything in it is never trusted on its own. Safe to run more than once for the same order:
 * the return page can be reloaded, and a notification may get here first.
 */
export async function finaliseHostedPayment(
  orderId: number,
  orderRef: string,
  returnParams: Record<string, string>
): Promise<FinaliseOutcome> {
  const notFound: HostedResult = {
    status: "failed",
    reason: "We couldn't find your order. If you were charged, please contact the shop.",
  };

  let order: WooOrder;
  try {
    order = await getWooOrder(orderId);
  } catch {
    return notFound;
  }
  // The order number alone is guessable, so the reference we generated must match too.
  if (readMeta(order, "_checkout_order_ref") !== orderRef) return notFound;

  const expectedTotal = Number(readMeta(order, "_cardstream_authorised_amount")) || Number(order.total) || 0;

  if (readMeta(order, "_checkout_awaiting_payment") !== "yes") {
    if (order.status === "processing" || order.status === "completed") {
      return { status: "paid", orderId: order.id, orderNumber: order.number, estimatedTotal: expectedTotal };
    }
    return { status: "failed", reason: "This payment didn't go through. Please try again." };
  }

  const outcome = await getCardstreamClient().getHostedOutcome({
    sessionId: readMeta(order, "_pay360_session_id"),
    orderRef,
    returnParams,
  });

  if (outcome.status === "pending") return { status: "pending" };
  return settleAwaitingOrder(order, expectedTotal, outcome);
}

export type SettledOutcome =
  | { status: "paid"; transactionId: string; amount: number }
  | { status: "failed"; reason: string };

/**
 * Closes off an order that was waiting for payment, once Pay360 has said how it ended: marks it paid
 * (and sends the emails) or failed. Shared by the hosted page return and the bank (3-D Secure) return.
 */
export async function settleAwaitingOrder(order: WooOrder, expectedTotal: number, outcome: SettledOutcome): Promise<HostedResult> {
  if (outcome.status === "failed") {
    await updateWooOrder(order.id, {
      status: "failed",
      meta_data: [{ key: "_checkout_awaiting_payment", value: "no" }],
    });
    return { status: "failed", reason: outcome.reason };
  }

  // Money has moved. If the amount isn't what we asked for, don't mark it paid: park it for staff.
  if (Math.abs(outcome.amount - expectedTotal) > 0.01) {
    console.error(
      `[pay360] order ${order.id}: paid ${outcome.amount.toFixed(2)} but expected ${expectedTotal.toFixed(2)} ` +
        `(transaction ${outcome.transactionId}). Left on hold for manual review.`
    );
    await updateWooOrder(order.id, {
      status: "on-hold",
      transaction_id: outcome.transactionId,
      meta_data: [
        { key: "_checkout_awaiting_payment", value: "no" },
        { key: "_cardstream_transaction_id", value: outcome.transactionId },
        { key: "_cardstream_amount_mismatch", value: `${outcome.amount.toFixed(2)} paid, ${expectedTotal.toFixed(2)} expected` },
      ],
    });
    return {
      status: "failed",
      reason: "We couldn't confirm the amount of your payment. Please contact the shop before trying again.",
    };
  }

  await updateWooOrder(order.id, {
    status: "processing",
    set_paid: true,
    transaction_id: outcome.transactionId,
    payment_method_title: "Card (Pay360) - paid in full",
    meta_data: [
      { key: "_checkout_awaiting_payment", value: "no" },
      { key: "_cardstream_transaction_id", value: outcome.transactionId },
      { key: "_cardstream_capture_status", value: "captured" },
    ],
  });

  // A failed email shouldn't undo a payment that has already been taken.
  try {
    const checkout = checkoutRequestSchema.parse(JSON.parse(readMeta(order, "_checkout_request")));
    const repriced = await repriceCheckoutRequest(checkout);
    await sendOrderConfirmation({
      to: checkout.customer.email,
      customerName: checkout.customer.firstName,
      orderNumber: order.number,
      repriced,
      slotLabel: checkout.fulfilment.slot.label,
      fulfilmentType: checkout.fulfilment.type,
      paidInFull: true,
    });
    await sendAdminNewOrderNotification({
      ...adminDeliveryFields(checkout),
      orderNumber: order.number,
      customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
      customerEmail: checkout.customer.email,
      repriced,
      slotLabel: checkout.fulfilment.slot.label,
      fulfilmentType: checkout.fulfilment.type,
      paidInFull: true,
    });
  } catch (err) {
    console.error(`[pay360] order ${order.id} is paid but its confirmation emails failed`, err);
  }

  return { status: "paid", orderId: order.id, orderNumber: order.number, estimatedTotal: expectedTotal };
}
