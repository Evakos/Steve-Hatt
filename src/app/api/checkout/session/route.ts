import { NextResponse } from "next/server";
import { z } from "zod";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { createOrderFromPayment } from "@/lib/checkout/create-order-from-payment";
import { repriceCheckoutRequest } from "@/lib/checkout/reprice";
import { sessionRequestSchema, type CheckoutRequest } from "@/lib/checkout/schema";
import { checkBookedSlot, christmasExclusionReason } from "@/lib/checkout/slot-rules";
import { deliveryMinimumMessage, deliveryShortfall } from "@/lib/checkout/delivery-minimum";
import { getCustomerSession } from "@/lib/customer-auth";
import { areOnlineOrdersClosed, getDisabledSlots, isChristmasShopActive } from "@/lib/feature-flags";
import { ORDERS_CLOSED_REASON } from "@/lib/ordering-window";
import { isSlotDisabled, slotWindowFromLabel } from "@/lib/slots";
import { getWooOrder, updateWooOrder } from "@/lib/woocommerce/orders";

// The card form reopens when the customer changes their details; it names the earlier unpaid order so
// that one can be cancelled instead of left behind.
const bodySchema = sessionRequestSchema.extend({
  replaces: z.object({ orderId: z.number().int().positive(), orderRef: z.string().min(1) }).optional(),
});

/** Cancels an unpaid order from an earlier attempt, but only if the reference matches and it is still awaiting payment. */
async function cancelReplacedOrder(replaces: { orderId: number; orderRef: string }) {
  try {
    const order = await getWooOrder(replaces.orderId);
    const ref = order.meta_data.find((m) => m.key === "_checkout_order_ref")?.value;
    const awaiting = order.meta_data.find((m) => m.key === "_checkout_awaiting_payment")?.value;
    if (ref === replaces.orderRef && awaiting === "yes") {
      await updateWooOrder(order.id, { status: "cancelled", meta_data: [{ key: "_checkout_awaiting_payment", value: "no" }] });
    }
  } catch {
    // Best effort: a leftover unpaid order is harmless.
  }
}

/**
 * Starts a card payment. The card is typed into Pay360's own payment page, shown in a frame on our
 * checkout, so no card details ever reach this server. This creates the WooCommerce order first, as
 * "pending" and flagged as awaiting payment (the details have to survive the customer leaving for
 * Pay360's page, and this project has no database), then asks Pay360 for a payment session and
 * returns the address to show in the frame. The order only becomes paid in finaliseHostedPayment,
 * after Pay360 confirms it.
 */
export async function POST(request: Request) {
  if (await areOnlineOrdersClosed()) {
    return NextResponse.json({ status: "closed", reason: ORDERS_CLOSED_REASON }, { status: 403 });
  }
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  const { replaces, ...details } = parsed.data;
  const checkout: CheckoutRequest = { ...details, payment: { token: "hosted" } };

  // Same rules as the older card route: the booked date decides Christmas, the slot must be
  // bookable and switched on, and nothing opted out of Christmas can be on a Christmas order.
  const slotCheck = checkBookedSlot(checkout.fulfilment.slot.date, { christmasShopActive: await isChristmasShopActive() });
  if (!slotCheck.ok) {
    return NextResponse.json({ status: "slot_unavailable", reason: slotCheck.reason }, { status: 409 });
  }
  checkout.fulfilment.slot.isChristmas = slotCheck.isChristmas;

  const slotWindow = slotWindowFromLabel(checkout.fulfilment.slot.label, checkout.fulfilment.type);
  if (slotWindow && isSlotDisabled(await getDisabledSlots(), new Date(checkout.fulfilment.slot.date), slotWindow)) {
    return NextResponse.json(
      { status: "slot_unavailable", reason: "Sorry, that time slot is no longer available. Please go back and choose another." },
      { status: 409 }
    );
  }

  const repriced = await repriceCheckoutRequest(checkout);
  const exclusion = christmasExclusionReason(repriced);
  if (exclusion) {
    return NextResponse.json({ status: "slot_unavailable", reason: exclusion }, { status: 409 });
  }

  const shortfall = deliveryShortfall(repriced.subtotal, checkout.fulfilment.type);
  if (shortfall > 0) {
    return NextResponse.json({ status: "minimum_not_met", reason: deliveryMinimumMessage(shortfall) }, { status: 409 });
  }

  const orderRef = crypto.randomUUID();
  const customerId = await getCustomerSession();
  if (replaces) await cancelReplacedOrder(replaces);
  const { order } = await createOrderFromPayment(checkout, "", orderRef, customerId, {
    awaitingPayment: true,
    requestJson: JSON.stringify(checkout),
  });

  const abandon = () =>
    updateWooOrder(order.id, { status: "failed", meta_data: [{ key: "_checkout_awaiting_payment", value: "no" }] }).catch(() => {});

  const returnUrl = `${new URL(request.url).origin}/checkout/return?order=${order.id}&ref=${orderRef}`;
  try {
    const session = await getCardstreamClient().createHostedSession({
      orderRef,
      amount: repriced.total,
      currency: "GBP",
      customerEmail: checkout.customer.email,
      customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
      description: `Steve Hatt Fishmongers order ${order.number}`,
      returnUrl,
      cancelUrl: `${returnUrl}&outcome=cancelled`,
    });
    if (session.status === "failed") {
      console.error(`[pay360] couldn't start a payment for order ${order.id}: ${session.reason}`);
      await abandon();
      return NextResponse.json({ status: "error" }, { status: 502 });
    }
    await updateWooOrder(order.id, { meta_data: [{ key: "_pay360_session_id", value: session.sessionId }] });
    return NextResponse.json({ status: "session", redirectUrl: session.redirectUrl, orderId: order.id, orderRef });
  } catch (err) {
    console.error(`[pay360] couldn't start a payment for order ${order.id}`, err);
    await abandon();
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
