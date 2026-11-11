"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";
import { DeliveryBox, Field, OrderBody, OrderTile, OrderTop, orderMeta } from "./order-parts";

// Pay360 authorisations expire 7 days after creation by default - after that, Capture (and
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
  const authorisedAmount = Number(orderMeta(order, "_cardstream_authorised_amount") ?? order.total);
  const depositAmount = Number(orderMeta(order, "_cardstream_deposit_amount") ?? 0);
  const slotLabel = orderMeta(order, "_checkout_slot_label") as string | undefined;

  const daysSinceAuth = Math.floor((new Date().getTime() - new Date(order.date_created).getTime()) / 86_400_000);
  const authExpired = daysSinceAuth >= AUTH_EXPIRY_DAYS;
  const authExpiringSoon = !authExpired && daysSinceAuth >= AUTH_WARNING_DAYS;

  const [amounts, setAmounts] = useState<Record<number, string>>(
    Object.fromEntries(order.line_items.map((li) => [li.id, li.total]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalTotal = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  // Deposit orders already collected a lump sum at checkout - only the balance needs capturing now.
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

  const authText =
    (daysSinceAuth <= 0 ? "Today" : `${daysSinceAuth} day${daysSinceAuth === 1 ? "" : "s"} ago`) +
    (authExpired
      ? `. The hold has likely expired (Pay360 holds last ${AUTH_EXPIRY_DAYS} days), so capture may fail.`
      : authExpiringSoon
        ? `. Expires in ${AUTH_EXPIRY_DAYS - daysSinceAuth} day${AUTH_EXPIRY_DAYS - daysSinceAuth === 1 ? "" : "s"}, capture soon.`
        : "");

  return (
    <OrderTile tone={authExpired ? "alert" : "normal"}>
      <OrderTop order={order} />
      <OrderBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label="When">
            <span className="font-medium">{slotLabel ?? "Not set"}</span>
          </Field>
          <Field label={depositAmount > 0 ? "Balance held on card" : "Held on card"} className="text-right">
            <span className="text-base font-semibold">£{authorisedAmount.toFixed(2)}</span>
            {depositAmount > 0 && <span className="block text-xs text-text-light">Deposit paid £{depositAmount.toFixed(2)}</span>}
          </Field>
        </div>
        <DeliveryBox order={order} />
        <Field label="Card authorised">
          <span className={authExpired ? "font-medium text-red-600" : authExpiringSoon ? "font-medium text-amber-600" : ""}>
            {authText}
          </span>
        </Field>

        <Field label="Final weighed price, per item">
          <ul className="mt-1 divide-y divide-border border-y border-border">
            {order.line_items.map((li) => {
              const unitPriceApplied = li.meta_data.find((m) => m.key === "Unit price applied")?.value as
                | string
                | undefined;
              const weightEstimated = li.meta_data.find((m) => m.key === "Weight (estimated)")?.value as
                | string
                | undefined;
              return (
                <li key={li.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0">
                    <span className="font-semibold">{li.quantity}×</span> {li.name}
                    {(unitPriceApplied || weightEstimated) && (
                      <span className="block text-xs text-text-light">
                        {[unitPriceApplied && `${unitPriceApplied} applied`, weightEstimated && `est. ${weightEstimated}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-text-light">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amounts[li.id]}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [li.id]: e.target.value }))}
                      className="w-20 border border-border px-2 py-1 text-right text-sm"
                      style={{ borderRadius: "4px" }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </Field>

        <div className="mt-auto flex items-center justify-between gap-3">
          <Field label="Final total">
            <span className="text-base font-semibold">£{finalTotal.toFixed(2)}</span>
            {overAuthorised && <span className="block text-xs text-red-600">More than the amount held</span>}
            {!overAuthorised && depositOverpaid && (
              <span className="block text-xs text-amber-600">Deposit overpayment will be refunded</span>
            )}
          </Field>
          <button
            type="button"
            onClick={handleCapture}
            disabled={submitting || overAuthorised || finalTotal <= 0}
            className="shrink-0 bg-lobster px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "6px" }}
          >
            {submitting ? "Capturing…" : "Capture payment"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </OrderBody>
    </OrderTile>
  );
}
