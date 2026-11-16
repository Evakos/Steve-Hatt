import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { readMeta, settleAwaitingOrder } from "@/lib/checkout/finalise-hosted-payment";
import { getWooOrder } from "@/lib/woocommerce/orders";

/**
 * Where the shopper's bank sends them back after the 3-D Secure step (a form post from the bank, so
 * POST). It finishes the payment with Pay360, settles the order, then sends the shopper on to the
 * normal return page, which shows the result. Nothing in the post is trusted on its own: the order
 * and its reference have to match what we saved, and Pay360 decides whether the payment went through.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const form = await request.formData().catch(() => null);
  const [orderIdRaw, orderRef, transactionId] = String(form?.get("MD") ?? "").split("|");
  const paRes = form?.get("PaRes");
  const orderId = Number(orderIdRaw);

  if (!Number.isInteger(orderId) || orderId <= 0 || !orderRef || !transactionId) {
    return NextResponse.redirect(`${origin}/checkout/return`, 303);
  }
  const onward = `${origin}/checkout/return?order=${orderId}&ref=${encodeURIComponent(orderRef)}`;

  try {
    const order = await getWooOrder(orderId);
    const matches =
      readMeta(order, "_checkout_order_ref") === orderRef && readMeta(order, "_pay360_transaction_id") === transactionId;
    if (matches && readMeta(order, "_checkout_awaiting_payment") === "yes") {
      const expectedTotal = Number(readMeta(order, "_cardstream_authorised_amount")) || Number(order.total) || 0;
      const resumed = await getCardstreamClient().resumeThreeDS({
        transactionId,
        paRes: typeof paRes === "string" && paRes ? paRes : undefined,
      });
      await settleAwaitingOrder(
        order,
        expectedTotal,
        resumed.status === "paid"
          ? { status: "paid", transactionId: resumed.transactionId, amount: expectedTotal }
          : { status: "failed", reason: resumed.reason }
      );
    }
  } catch (err) {
    console.error(`[pay360] couldn't finish the bank step for order ${orderId}`, err);
  }

  return NextResponse.redirect(onward, 303);
}
