"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";

// Pay360 authorisations expire 7 days after creation by default — after that, Capture (and
// Cancel) both fail (docs.pay360.com/cards/authorisations). Order date_created is a reliable
// proxy for "when the hold was placed" since the WooCommerce order is only ever created right
// after a successful authoriseSale (see create-order-from-payment.ts).
const AUTH_EXPIRY_DAYS = 7;
const AUTH_WARNING_DAYS = 5;

interface Props {
  order: WooOrder;
}

export default function CaptureOrderCard({ order }: Props) {
  const router = useRouter();
  const authorisedAmount = Number(order.meta_data.find((m) => m.key === "_cardstream_authorised_amount")?.value ?? order.total);
  const depositAmount = Number(order.meta_data.find((m) => m.key === "_cardstream_deposit_amount")?.value ?? 0);
  const slotLabel = order.meta_data.find((m) => m.key === "_checkout_slot_label")?.value as string | undefined;
  const isChristmasOrder = order.meta_data.find((m) => m.key === "_checkout_is_christmas")?.value === "true";

  const daysSinceAuth = Math.floor((new Date().getTime() - new Date(order.date_created).getTime()) / 86_400_000);
  const authExpired = daysSinceAuth >= AUTH_EXPIRY_DAYS;
  const authExpiringSoon = !authExpired && daysSinceAuth >= AUTH_WARNING_DAYS;

  const [amounts, setAmounts] = useState<Record<number, string>>(
    Object.fromEntries(order.line_items.map((li) => [li.id, li.total]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalTotal = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  // Deposit orders already collected a lump sum at checkout — only the balance needs capturing now.
  const balanceOwed = Math.max(0, finalTotal - depositAmount);
  const overAuthorised = balanceOwed > authorisedAmount + 0.001; // small epsilon for float rounding
  const depositOverpaid = depositAmount > 0 && finalTotal < depositAmount - 0.001;

  async function handleCapture() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          lineItems: Object.entries(amounts).map(([id, finalTotal]) => ({ id: Number(id), finalTotal: Number(finalTotal) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Capture failed");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium text-navy">
          Order #{order.number}, {order.billing.first_name} {order.billing.last_name}
          {isChristmasOrder && (
            <span className="ml-2 bg-[#c94b4b] px-2 py-0.5 align-middle text-xs font-medium text-white" style={{ borderRadius: "999px" }}>
              Christmas
            </span>
          )}
        </h2>
        <span className="text-sm text-text-light">
          {depositAmount > 0
            ? `Deposit paid: £${depositAmount.toFixed(2)} · Balance held: £${authorisedAmount.toFixed(2)}`
            : `Authorised: £${authorisedAmount.toFixed(2)}`}
        </span>
      </div>
      {slotLabel && <p className="mt-0.5 text-sm text-text-light">{slotLabel}</p>}
      <p className={`mt-0.5 text-sm ${authExpired ? "font-medium text-red-600" : authExpiringSoon ? "font-medium text-amber-600" : "text-text-light"}`}>
        {daysSinceAuth <= 0
          ? "Authorised today"
          : `Authorised ${daysSinceAuth} day${daysSinceAuth === 1 ? "" : "s"} ago`}
        {authExpired
          ? `, hold has likely expired (Pay360 authorisations last ${AUTH_EXPIRY_DAYS} days), capture may fail`
          : authExpiringSoon
            ? `, expires in ${AUTH_EXPIRY_DAYS - daysSinceAuth} day${AUTH_EXPIRY_DAYS - daysSinceAuth === 1 ? "" : "s"}, capture soon`
            : ""}
      </p>

      <div className="mt-3 space-y-2">
        {order.line_items.map((li) => {
          const unitPriceApplied = li.meta_data.find((m) => m.key === "Unit price applied")?.value as
            | string
            | undefined;
          const weightEstimated = li.meta_data.find((m) => m.key === "Weight (estimated)")?.value as
            | string
            | undefined;
          return (
            <div key={li.id} className="flex items-center justify-between gap-3 text-base">
              <span className="text-navy">
                {li.name}
                {(unitPriceApplied || weightEstimated) && (
                  <span className="ml-2 text-xs text-text-light">
                    {[unitPriceApplied && `${unitPriceApplied} applied`, weightEstimated && `est. ${weightEstimated}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-text-light">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amounts[li.id]}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [li.id]: e.target.value }))}
                  className="w-24 border border-border px-2 py-1 text-right text-sm"
                  style={{ borderRadius: "4px" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-base font-medium text-navy">
          Final total: £{finalTotal.toFixed(2)}
          {overAuthorised && <span className="ml-2 text-xs font-normal text-red-600">exceeds balance held</span>}
          {!overAuthorised && depositOverpaid && (
            <span className="ml-2 text-xs font-normal text-amber-600">deposit overpayment will be refunded</span>
          )}
        </span>
        <button
          type="button"
          onClick={handleCapture}
          disabled={submitting || overAuthorised || finalTotal <= 0}
          className="bg-lobster px-4 py-2 text-base font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "5px" }}
        >
          {submitting ? "Capturing…" : "Capture payment"}
        </button>
      </div>
      {error && <p className="mt-2 text-base text-red-600">{error}</p>}
    </div>
  );
}
