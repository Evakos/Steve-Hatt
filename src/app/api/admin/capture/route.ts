import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { getWooOrder, updateWooOrder } from "@/lib/woocommerce/orders";
import { sendCaptureConfirmation } from "@/lib/email/send-order-confirmation";

const captureRequestSchema = z.object({
  orderId: z.number().int().positive(),
  lineItems: z.array(z.object({ id: z.number().int().positive(), finalTotal: z.number().nonnegative() })).min(1),
});

export async function POST(request: Request) {
  // Defense-in-depth: proxy.ts already gates /api/admin/*, but per the framework's own guidance
  // a matcher/route refactor could silently drop that coverage, so re-check here too.
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = captureRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { orderId, lineItems } = parsed.data;

  const order = await getWooOrder(orderId);
  if (order.status !== "on-hold") {
    return NextResponse.json({ error: `Order is not awaiting capture (status: ${order.status})` }, { status: 409 });
  }

  const transactionId = order.meta_data.find((m) => m.key === "_cardstream_transaction_id")?.value as
    | string
    | undefined;
  const authorisedAmountStr = order.meta_data.find((m) => m.key === "_cardstream_authorised_amount")?.value as
    | string
    | undefined;
  if (!transactionId || !authorisedAmountStr) {
    return NextResponse.json({ error: "Order is missing payment authorisation details" }, { status: 500 });
  }
  const authorisedAmount = Number(authorisedAmountStr);

  // Deposit orders (pay-a-lump-sum-up-front) had their deposit captured at checkout — `authorisedAmount`
  // here is only the *balance* hold placed by the cron. Plain orders authorised the full total.
  const depositAmountStr = order.meta_data.find((m) => m.key === "_cardstream_deposit_amount")?.value as
    | string
    | undefined;
  const depositAmount = depositAmountStr ? Number(depositAmountStr) : 0;

  const finalTotal = lineItems.reduce((sum, li) => sum + li.finalTotal, 0);

  // What's still owed is the final total minus anything already collected as a deposit. Confirmed via
  // docs.pay360.com/cards/captures: Capture always takes the full authorised amount, no partial capture
  // — so the balance owed can never exceed the balance hold; anything above it needs a *new*
  // authorisation for the difference, which isn't supported yet.
  const balanceOwed = Math.max(0, finalTotal - depositAmount);
  if (balanceOwed > authorisedAmount) {
    return NextResponse.json(
      {
        error: `Balance still owed (£${balanceOwed.toFixed(2)}) exceeds the authorised balance (£${authorisedAmount.toFixed(2)}), a new authorisation is needed for the difference, this isn't supported yet.`,
      },
      { status: 422 }
    );
  }

  const existingById = new Map(order.line_items.map((li) => [li.id, li]));
  const missingIds = lineItems.filter((li) => !existingById.has(li.id));
  if (missingIds.length > 0) {
    return NextResponse.json({ error: `Line item id(s) not found on this order: ${missingIds.map((li) => li.id).join(", ")}` }, { status: 400 });
  }

  const cardstream = getCardstreamClient();
  const orderRef = order.meta_data.find((m) => m.key === "_checkout_order_ref")?.value as string | undefined;

  // Capture the balance hold in full (Pay360 doesn't support capturing less), then refund any
  // difference back down to what's actually owed. If nothing more is owed (weighed to or below the
  // deposit already collected), skip the balance capture entirely — and refund any deposit
  // overpayment back from the deposit transaction.
  const refundAmount = authorisedAmount - balanceOwed;

  if (balanceOwed > 0.001) {
    const captureResult = await cardstream.captureSale({ transactionId, orderRef: orderRef ?? String(orderId) });
    if (captureResult.status === "failed") {
      return NextResponse.json({ error: `Capture failed: ${captureResult.reason}` }, { status: 502 });
    }
  }

  if (refundAmount > 0.001) {
    const refundResult = await cardstream.refundSale({
      transactionId,
      amount: refundAmount,
      orderRef: orderRef ?? String(orderId),
    });
    if (refundResult.status === "failed") {
      // The balance hold was already captured in full — that part succeeded and fulfilment should
      // proceed. What failed is only handing back the difference, so flag it for a manual refund via
      // the Pay360 Merchant Portal rather than silently under-reporting what was actually charged.
      await updateWooOrder(orderId, {
        status: "processing",
        set_paid: true,
        line_items: lineItems.map((li) => ({
          id: li.id,
          product_id: existingById.get(li.id)!.product_id,
          quantity: existingById.get(li.id)!.quantity,
          subtotal: li.finalTotal.toFixed(2),
          total: li.finalTotal.toFixed(2),
        })),
        meta_data: [
          { key: "_cardstream_capture_status", value: "captured_refund_failed" },
          { key: "_cardstream_captured_amount", value: finalTotal.toFixed(2) },
          { key: "_cardstream_refund_pending_amount", value: refundAmount.toFixed(2) },
        ],
      });
      return NextResponse.json(
        {
          error: `Captured the £${authorisedAmount.toFixed(2)} balance, but refunding the £${refundAmount.toFixed(2)} difference failed: ${refundResult.reason}. The order has been marked as processing, refund the difference manually via the Pay360 Merchant Portal.`,
        },
        { status: 502 }
      );
    }
  }

  // Refund any deposit overpayment (weighed to less than the deposit already collected at checkout).
  let depositRefundMeta: { key: string; value: string }[] = [];
  if (depositAmount > 0 && finalTotal < depositAmount - 0.001) {
    const depositTransactionId = order.meta_data.find((m) => m.key === "_cardstream_deposit_transaction_id")?.value as
      | string
      | undefined;
    const overpayment = depositAmount - finalTotal;
    if (depositTransactionId) {
      const overRefund = await cardstream.refundSale({
        transactionId: depositTransactionId,
        amount: overpayment,
        orderRef: orderRef ?? String(orderId),
      });
      if (overRefund.status === "failed") {
        depositRefundMeta = [{ key: "_cardstream_deposit_refund_pending_amount", value: overpayment.toFixed(2) }];
      }
    }
  }

  const updated = await updateWooOrder(orderId, {
    status: "processing",
    set_paid: true,
    line_items: lineItems.map((li) => ({
      id: li.id,
      product_id: existingById.get(li.id)!.product_id,
      quantity: existingById.get(li.id)!.quantity,
      subtotal: li.finalTotal.toFixed(2),
      total: li.finalTotal.toFixed(2),
    })),
    meta_data: [
      { key: "_cardstream_capture_status", value: "captured" },
      { key: "_cardstream_captured_amount", value: finalTotal.toFixed(2) },
      ...(refundAmount > 0.001 ? [{ key: "_cardstream_refunded_amount", value: refundAmount.toFixed(2) }] : []),
      ...depositRefundMeta,
    ],
  });

  // A failed email shouldn't fail the capture — payment has already moved.
  await sendCaptureConfirmation({
    to: order.billing.email,
    customerName: order.billing.first_name,
    orderNumber: updated.number,
    capturedAmount: finalTotal,
    authorisedAmount,
    ...(depositAmount > 0 ? { depositAmount } : {}),
  });

  return NextResponse.json({ status: "captured", orderId: updated.id, orderNumber: updated.number, capturedAmount: finalTotal });
}
