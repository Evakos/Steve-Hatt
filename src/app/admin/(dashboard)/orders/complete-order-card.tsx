"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";
import { DeliveryBox, Field, OrderBody, OrderItems, OrderTile, OrderTop, orderMeta } from "./order-parts";

interface Props {
  order: WooOrder;
}

export default function CompleteOrderCard({ order }: Props) {
  const router = useRouter();
  const slotLabel = orderMeta(order, "_checkout_slot_label") as string | undefined;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to mark complete");
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
    <OrderTile>
      <OrderTop order={order} />
      <OrderBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label="When">
            <span className="font-medium">{slotLabel ?? "Not set"}</span>
          </Field>
          <Field label="Paid" className="text-right">
            <span className="text-base font-semibold">£{Number(order.total).toFixed(2)}</span>
          </Field>
        </div>
        <DeliveryBox order={order} />
        <OrderItems order={order} />
        <div className="mt-auto">
          {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="w-full bg-teal px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "6px" }}
          >
            {submitting ? "Completing…" : "Mark complete"}
          </button>
        </div>
      </OrderBody>
    </OrderTile>
  );
}
