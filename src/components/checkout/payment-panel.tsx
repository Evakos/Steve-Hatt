"use client";

import HostedPaymentFrame from "@/components/checkout/hosted-payment-frame";
import type { HostedResult } from "@/lib/checkout/hosted-result";
import type { CheckoutRequest } from "@/lib/checkout/schema";

interface Props {
  /** The checkout details to pay for, or null when they aren't complete yet. */
  buildRequest: () => Omit<CheckoutRequest, "payment"> | null;
  onResult: (result: HostedResult) => void;
}

/**
 * Where the customer types their card. The form is Pay360's own payment page, shown in a frame right
 * here on the checkout, so card details go from the browser straight to Pay360 and never touch our
 * server or WordPress (see HostedPaymentFrame and /api/checkout/session). While the built-in test
 * payments are on, the frame shows a stand-in page (/mock-pay360) with no card form.
 */
export default function PaymentPanel({ buildRequest, onResult }: Props) {
  return <HostedPaymentFrame buildRequest={buildRequest} onResult={onResult} />;
}
