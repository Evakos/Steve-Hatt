import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { createOrderFromPayment } from "@/lib/checkout/create-order-from-payment";
import { createPreOrderFromVerification } from "@/lib/checkout/create-preorder-from-verification";
import { repriceCheckoutRequest } from "@/lib/checkout/reprice";
import { checkoutRequestSchema } from "@/lib/checkout/schema";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email/send-order-confirmation";
import { getCustomerSession } from "@/lib/customer-auth";
import { getChristmasDepositAmount, getChristmasUseDepositFlow } from "@/lib/feature-flags";

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

  // Christmas pre-orders: by default charged in full upfront (fixed prices make this exact).
  // The legacy deposit/part-payment flow is gated behind getChristmasUseDepositFlow()
  // (see /admin/products); with that flag off, the full total is authorised and captured
  // immediately, same as checking "pay now" on any other checkout.
  if (checkout.fulfilment.slot.isChristmas) {
    const useDepositFlow = await getChristmasUseDepositFlow();
    if (useDepositFlow) {
    const depositConfig = await getChristmasDepositAmount();
    // Per-product "Christmas deposit" in the spreadsheet takes priority (matches how the shop has
    // always worked); the blanket default applies only when no product has a deposit set.
    const perProductDeposit = repriced.lineItems.reduce((sum, li) => sum + (li.christmasDeposit ?? 0) * li.quantity, 0);
    const depositAmount = Math.round(Math.min(perProductDeposit > 0 ? perProductDeposit : depositConfig, repriced.total) * 100) / 100;

    if (depositAmount > 0) {
      const depositAuth = await cardstream.authoriseSale({
        token: checkout.payment.token,
        amount: depositAmount,
        currency: "GBP",
        orderRef,
        customerEmail: checkout.customer.email,
      });

      if (depositAuth.status === "declined") {
        return NextResponse.json({ status: "declined", reason: depositAuth.reason }, { status: 402 });
      }

      // 3DS on the deposit - complete via /api/checkout/confirm (which re-derives the deposit
      // deterministically and continues the deposit-capture + balance-verify flow).
      if (depositAuth.status === "requires_action") {
        return NextResponse.json({
          status: "requires_action",
          transactionId: depositAuth.transactionId,
          challenge: depositAuth.challenge,
          orderRef,
        });
      }

      // Deposit authorised - capture it immediately so funds move now. Pay360 captures the full
      // authorised amount; the deposit is its own transaction of exactly `depositAmount`, so this
      // is a clean full capture rather than the capture-then-refund shape used on final weigh-in.
      const captureResult = await cardstream.captureSale({ transactionId: depositAuth.transactionId, orderRef });
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
        transactionId: depositAuth.transactionId,
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

    // No deposit configured - plain verify-only pre-order flow (no hold, no 7-day clock).
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
    // Full payment upfront (the default): fixed Christmas prices make the total exact -
    // authorise it all, capture immediately, mark the order as paid. No hold, no
    // capture queue, no refund - just a normal "pay now" checkout.
    const auth = await cardstream.authoriseSale({
      token: checkout.payment.token,
      amount: repriced.total,
      currency: "GBP",
      orderRef,
      customerEmail: checkout.customer.email,
    });

    if (auth.status === "declined") {
      return NextResponse.json({ status: "declined", reason: auth.reason }, { status: 402 });
    }

    if (auth.status === "requires_action") {
      return NextResponse.json({
        status: "requires_action",
        transactionId: auth.transactionId,
        challenge: auth.challenge,
        orderRef,
      });
    }

    const captureResult = await cardstream.captureSale({
      transactionId: auth.transactionId,
      orderRef,
    });
    if (captureResult.status === "failed") {
      return NextResponse.json({ error: `Capture failed: ${captureResult.reason}` }, { status: 502 });
    }

    const { order } = await createOrderFromPayment(checkout, auth.transactionId, orderRef, customerId, { paid: true });

    // A failed email shouldn't fail the order - payment has already moved.
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
      orderNumber: order.number,
      customerName: `${checkout.customer.firstName} ${checkout.customer.lastName}`,
      customerEmail: checkout.customer.email,
      repriced,
      slotLabel: checkout.fulfilment.slot.label,
      fulfilmentType: checkout.fulfilment.type,
      paidInFull: true,
    });

    return NextResponse.json({
      status: "authorised",
      orderId: order.id,
      orderNumber: order.number,
      estimatedTotal: repriced.total,
      paidInFull: true,
    });

  }

  // Only authorises (places a hold) - fish is priced by weight, so the exact amount isn't known
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
    // No order is created yet - avoids an orphaned unpaid order if the shopper abandons the
    // 3DS challenge. The client completes the challenge and calls /api/checkout/confirm.
    return NextResponse.json({
      status: "requires_action",
      transactionId: result.transactionId,
      challenge: result.challenge,
      orderRef,
    });
  }

  const { order } = await createOrderFromPayment(checkout, result.transactionId, orderRef, customerId);

  // A failed email shouldn't fail the order - it's already authorised and created.
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
