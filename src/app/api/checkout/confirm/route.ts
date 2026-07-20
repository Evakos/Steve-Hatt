import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { createOrderFromPayment } from "@/lib/checkout/create-order-from-payment";
import { confirmRequestSchema } from "@/lib/checkout/schema";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email/send-order-confirmation";
import { getCustomerSession } from "@/lib/customer-auth";

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
