"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { HOSTED_MESSAGE_SOURCE, type HostedResult } from "@/lib/checkout/hosted-result";

/**
 * Shown inside the card frame once Pay360 sends the customer back. In the frame, it hands the
 * result to the checkout page (same site only) and the checkout page takes over. On its own, as a
 * full page, it clears the basket after a paid order and shows the result with a link onwards.
 */
export default function HostedReturnBridge({ result }: { result: HostedResult }) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ source: HOSTED_MESSAGE_SOURCE, result }, window.location.origin);
    } else if (result.status === "paid") {
      clearCart();
    }
    // Only the result matters: re-running when clearCart's identity changes would resend the message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const paid = result.status === "paid";

  return (
    <main className="flex flex-1 items-center justify-center bg-cream px-6 py-10">
      <div className="max-w-md text-center">
        {paid ? <CheckCircle2 className="mx-auto h-8 w-8 text-teal" /> : <AlertCircle className="mx-auto h-8 w-8 text-lobster" />}
        <h1 className="mt-3 font-serif text-2xl font-bold text-navy">{paid ? "Payment received" : "Payment not completed"}</h1>
        <p className="mt-2 text-sm text-text-light">
          {result.status === "paid"
            ? `Thank you. Your order number is ${result.orderNumber}, and a confirmation email is on its way.`
            : result.reason}
        </p>
        <Link
          href={paid ? "/shop" : "/checkout"}
          target="_top"
          className="mt-5 inline-block bg-navy px-5 py-2.5 text-sm font-medium text-white"
          style={{ borderRadius: "6px" }}
        >
          {paid ? "Back to the shop" : "Back to checkout"}
        </Link>
      </div>
    </main>
  );
}
