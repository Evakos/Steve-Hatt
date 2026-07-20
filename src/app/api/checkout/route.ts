import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { createOrderFromPayment } from "@/lib/checkout/create-order-from-payment";
import { createPreOrderFromVerification } from "@/lib/checkout/create-preorder-from-verification";
import { repriceCheckoutRequest } from "@/lib/checkout/reprice";
import { checkoutRequestSchema } from "@/lib/checkout/schema";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email/send-order-confirmation";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  const checkout = parsed.data;
  const customerId = await getCustomerSession();

  const repriced = await repriceCheckoutRequest(checkout);
  const orderRef = crypto.randomUUID();
  const cardstream = getCardstreamClient();

  // Christmas pre-orders can be placed from 1st November for delivery on the 23rd/24th
  // December — far longer than a Pay360 authorisation survives (7 days, see
  // src/lib/cardstream/real-client.ts). So instead of authorising now, verify the card (no hold
  // placed, no expiry clock started) and let src/app/api/cron/reauthorise-preorders/route.ts
  // place the real hold a few days before the delivery slot. Reports the same "authorised"
  // status back to the client either way — the frontend only needs to know checkout succeeded,
  // not which payment path produced that result.
  if (checkout.fulfilment.slot.isChristmas) {
    const verifyResult = await cardstream.verifyCard({
      token: checkout.payment.token,
      orderRef,
      customerEmail: checkout.customer.email,
    });

    if (verifyResult.status === "declined") {
      return NextResponse.json({ status: "declined", reason: verifyResult.reason }, { status: 402 });
    }

    const { order } = await createPreOrderFromVerification(checkout, verifyResult.cardToken, orderRef, customerId);

    await sendOrderConfirmation({
      to: checkout.customer.email,
      customerName: checkout.customer.firstName,
      orderNumber: order.number,
      repriced,
      slotLabel: checkout.fulfilment.slot.label,
      fulfilmentType: checkout.fulfilment.type,
    });
    await sendAdminNewOrderNotification({
      orderNumber: order.number,
      customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
      customerEmail: checkout.customer.email,
      repriced,
      slotLabel: checkout.fulfilment.slot.label,
      fulfilmentType: checkout.fulfilment.type,
    });

    return NextResponse.json({
      status: "authorised",
      orderId: order.id,
      orderNumber: order.number,
      estimatedTotal: repriced.total,
    });
  }

  // Only authorises (places a hold) — fish is priced by weight, so the exact amount isn't known
  // until the order is prepared. Staff capture the confirmed final amount later via /admin.
  const result = await cardstream.authoriseSale({
    token: checkout.payment.token,
    amount: repriced.total,
    currency: "GBP",
    orderRef,
    customerEmail: checkout.customer.email,
  });

  if (result.status === "declined") {
    return NextResponse.json({ status: "declined", reason: result.reason }, { status: 402 });
  }

  if (result.status === "requires_action") {
    // No order is created yet — avoids an orphaned unpaid order if the shopper abandons the
    // 3DS challenge. The client completes the challenge and calls /api/checkout/confirm.
    return NextResponse.json({
      status: "requires_action",
      transactionId: result.transactionId,
      challenge: result.challenge,
      orderRef,
    });
  }

  const { order } = await createOrderFromPayment(checkout, result.transactionId, orderRef, customerId);

  // A failed email shouldn't fail the order — it's already authorised and created.
  await sendOrderConfirmation({
    to: checkout.customer.email,
    customerName: checkout.customer.firstName,
    orderNumber: order.number,
    repriced,
    slotLabel: checkout.fulfilment.slot.label,
    fulfilmentType: checkout.fulfilment.type,
  });
  await sendAdminNewOrderNotification({
    orderNumber: order.number,
    customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
    customerEmail: checkout.customer.email,
    repriced,
    slotLabel: checkout.fulfilment.slot.label,
    fulfilmentType: checkout.fulfilment.type,
  });

  return NextResponse.json({
    status: "authorised",
    orderId: order.id,
    orderNumber: order.number,
    estimatedTotal: repriced.total,
  });
}
