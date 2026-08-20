import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { listPendingPreOrders, updateWooOrder } from "@/lib/woocommerce/orders";
import { sendPreOrderAuthFailedEmail, sendAdminPreOrderAuthFailedAlert } from "@/lib/email/send-order-confirmation";

// Pay360 authorisations expire 7 days after creation (docs.pay360.com/cards/authorisations).
// Re-authorise this many days before the delivery slot, leaving a buffer inside that 7-day
// window in case staff don't capture the same day (e.g. a run of busy prep days).
const AUTH_LEAD_DAYS = 5;

/**
 * Runs daily via Vercel Cron (see vercel.json) to place the real authorisation on Christmas
 * pre-orders shortly before their delivery slot, using the merchant card token collected at
 * checkout (src/lib/checkout/create-preorder-from-verification.ts) instead of the customer's
 * original one-time Hosted Payment Fields token. This is what keeps a pre-order placed on 1st
 * November from having its hold expire six weeks before staff ever try to capture it.
 *
 * Idempotent by construction: a successfully re-authorised order moves out of the "pending"
 * status this queries (listPendingPreOrders), so re-running the same day is harmless.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${getServerEnv().CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cardstream = getCardstreamClient();
  const preOrders = await listPendingPreOrders();
  const christmasPreOrders = preOrders.filter(
    (order) => order.meta_data.find((m) => m.key === "_checkout_is_christmas")?.value === "true"
  );

  const summary = { reauthorised: 0, tooEarly: 0, failed: 0, skippedIncomplete: 0 };

  for (const order of christmasPreOrders) {
    const cardToken = order.meta_data.find((m) => m.key === "_cardstream_card_token")?.value as string | undefined;
    const estimatedAmountStr = order.meta_data.find((m) => m.key === "_cardstream_estimated_amount")?.value as
      | string
      | undefined;
    const balanceAmountStr = order.meta_data.find((m) => m.key === "_cardstream_balance_amount")?.value as
      | string
      | undefined;
    const slotDateStr = order.meta_data.find((m) => m.key === "_checkout_slot_date")?.value as string | undefined;
    const orderRef = order.meta_data.find((m) => m.key === "_checkout_order_ref")?.value as string | undefined;

    // Deposit orders (pay-a-lump-sum-up-front) re-authorise only the outstanding balance, since the
    // deposit was already captured at checkout. Plain pre-orders re-authorise the whole estimate.
    const authAmountStr = balanceAmountStr ?? estimatedAmountStr;

    if (!cardToken || !authAmountStr || !slotDateStr) {
      // Shouldn't happen for orders created via createPreOrderFromVerification, but a "pending"
      // order could in principle come from elsewhere - skip rather than guessing.
      summary.skippedIncomplete++;
      continue;
    }

    const daysUntilSlot = Math.ceil((new Date(slotDateStr).getTime() - Date.now()) / 86_400_000);
    if (daysUntilSlot > AUTH_LEAD_DAYS) {
      summary.tooEarly++;
      continue;
    }

    const authResult = await cardstream.authoriseSaleWithToken({
      cardToken,
      amount: Number(authAmountStr),
      currency: "GBP",
      orderRef: orderRef ?? String(order.id),
    });

    if (authResult.status === "declined") {
      summary.failed++;
      await updateWooOrder(order.id, {
        meta_data: [
          { key: "_cardstream_preauth_status", value: "auth_failed" },
          { key: "_cardstream_preauth_failure_reason", value: authResult.reason },
        ],
      });
      await sendPreOrderAuthFailedEmail({
        to: order.billing.email,
        customerName: order.billing.first_name,
        orderNumber: order.number,
      });
      await sendAdminPreOrderAuthFailedAlert({
        orderNumber: order.number,
        customerName: `${order.billing.first_name} ${order.billing.last_name}`,
        customerEmail: order.billing.email,
        reason: authResult.reason,
      });
      continue;
    }

    summary.reauthorised++;
    // Same shape as create-order-from-payment.ts's outcome - from here the order is
    // indistinguishable from a normal authorised order and needs no special handling in
    // /admin/orders or the capture route.
    await updateWooOrder(order.id, {
      status: "on-hold",
      meta_data: [
        { key: "_cardstream_transaction_id", value: authResult.transactionId },
        { key: "_cardstream_authorised_amount", value: authAmountStr },
        { key: "_cardstream_capture_status", value: "pending" },
        { key: "_cardstream_preauth_status", value: "authorised" },
      ],
    });
  }

  return NextResponse.json({ status: "done", total: christmasPreOrders.length, ...summary });
}
