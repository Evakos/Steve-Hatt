import HostedReturnBridge from "@/components/checkout/hosted-return-bridge";
import { finaliseHostedPayment } from "@/lib/checkout/finalise-hosted-payment";
import type { HostedResult } from "@/lib/checkout/hosted-result";

// This page settles an order, so it must run fresh every time and never be indexed.
export const dynamic = "force-dynamic";
export const metadata = { title: "Confirming your payment", robots: { index: false, follow: false } };

/**
 * Where Pay360's payment page sends the customer afterwards. It is loaded inside the card frame on
 * the checkout: it asks Pay360 whether the payment went through, then tells the checkout page (see
 * HostedReturnBridge). If it is opened on its own instead, it just shows the result.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params[key] = value;
  }

  const orderId = Number(params.order);
  const ref = params.ref ?? "";
  let result: HostedResult;

  if (!Number.isInteger(orderId) || orderId <= 0 || !ref) {
    result = { status: "failed", reason: "We couldn't find your order. If you were charged, please contact the shop." };
  } else if (params.outcome === "cancelled") {
    result = { status: "failed", reason: "The payment was cancelled and you haven't been charged." };
  } else {
    try {
      const outcome = await finaliseHostedPayment(orderId, ref, params);
      result =
        outcome.status === "pending"
          ? {
              status: "failed",
              reason:
                "We're still waiting for your bank to confirm the payment. Please don't pay again: check your email for a confirmation, or contact the shop.",
            }
          : outcome;
    } catch (err) {
      console.error(`[pay360] couldn't confirm the payment for order ${orderId}`, err);
      result = {
        status: "failed",
        reason: "We couldn't confirm your payment just now. Please don't pay again: contact the shop and we'll check it.",
      };
    }
  }

  return <HostedReturnBridge result={result} />;
}
