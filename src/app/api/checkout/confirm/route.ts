import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { createOrderFromPayment } from "@/lib/checkout/create-order-from-payment";
import { createPreOrderFromVerification } from "@/lib/checkout/create-preorder-from-verification";
import { repriceCheckoutRequest } from "@/lib/checkout/reprice";
import { confirmRequestSchema } from "@/lib/checkout/schema";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email/send-order-confirmation";
import { getCustomerSession } from "@/lib/customer-auth";
import { getChristmasDepositAmount } from "@/lib/feature-flags";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = confirmRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  const { transactionId, orderRef, threeDSResponse, checkout } = parsed.data;
  const customerId = await getCustomerSession();

  const cardstream = getCardstreamClient();
  const result = await cardstream.confirmThreeDS({ transactionId, threeDSResponse });

  if (result.status === "declined") {
    return NextResponse.json({ status: "declined", reason: "3-D Secure verification failed" }, { status: 402 });
  }

  // Christmas deposit orders that hit 3DS on the deposit authorisation resume here: complete 3DS,
  // capture the deposit, then verify the card for the outstanding balance (mirrors /api/checkout's
  // non-3DS deposit path). Deposit amount is re-derived deterministically from the order total.
  if (checkout.fulfilment.slot.isChristmas) {
    const repriced = await repriceCheckoutRequest(checkout);
    const depositConfig = await getChristmasDepositAmount();
    const depositAmount = Math.round(Math.min(depositConfig, repriced.total) * 100) / 100;

    if (depositAmount > 0) {
      const captureResult = await cardstream.captureSale({ transactionId: result.transactionId, orderRef });
      if (captureResult.status === "failed") {
        return NextResponse.json({ error: `Deposit capture failed: ${captureResult.reason}` }, { status: 502 });
      }

      const verifyResult = await cardstream.verifyCard({
        token: checkout.payment.token,
        orderRef,
        customerEmail: checkout.customer.email,
      });
      if (verifyResult.status === "declined") {
        return NextResponse.json({ status: "declined", reason: verifyResult.reason }, { status: 402 });
      }

      const { order } = await createPreOrderFromVerification(checkout, verifyResult.cardToken, orderRef, customerId, {
        amount: depositAmount,
        transactionId: result.transactionId,
      });

      await sendOrderConfirmation({
        to: checkout.customer.email,
        customerName: checkout.customer.firstName,
        orderNumber: order.number,
        repriced,
        slotLabel: checkout.fulfilment.slot.label,
        fulfilmentType: checkout.fulfilment.type,
        depositAmount,
      });
      await sendAdminNewOrderNotification({
        orderNumber: order.number,
        customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
        customerEmail: checkout.customer.email,
        repriced,
        slotLabel: checkout.fulfilment.slot.label,
        fulfilmentType: checkout.fulfilment.type,
        depositAmount,
      });

      return NextResponse.json({
        status: "authorised",
        orderId: order.id,
        orderNumber: order.number,
        estimatedTotal: repriced.total,
        depositAmount,
      });
    }
  }

  const { order, repriced } = await createOrderFromPayment(checkout, result.transactionId, orderRef, customerId);

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
