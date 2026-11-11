"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";
import OrderBadges, { OrderDeliveryDetails } from "./order-badges";

interface Props {
  order: WooOrder;
}

export default function CompleteOrderCard({ order }: Props) {
  const router = useRouter();
  const slotLabel = order.meta_data.find((m) => m.key === "_checkout_slot_label")?.value as string | undefined;

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
    <div className="flex h-full flex-col justify-between gap-3 border border-border bg-cream p-3.5" style={{ borderRadius: "12px" }}>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-navy">
            <span className="font-semibold">#{order.number}</span> {order.billing.first_name} {order.billing.last_name}
          </p>
          <p className="shrink-0 text-sm font-semibold text-navy">£{order.total}</p>
        </div>
        {slotLabel && <p className="mt-0.5 text-xs font-medium text-text-light">{slotLabel}</p>}
        <OrderBadges order={order} />
        <OrderDeliveryDetails order={order} />
      </div>
      <div>
        {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleComplete}
          disabled={submitting}
          className="w-full bg-teal px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "6px" }}
        >
          {submitting ? "Completing…" : "Mark complete"}
        </button>
      </div>
    </div>
  );
}
