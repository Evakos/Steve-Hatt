"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";

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
    <div className="flex items-center justify-between border border-border bg-white p-4" style={{ borderRadius: "5px" }}>
      <div>
        <p className="text-sm font-medium text-navy">
          Order #{order.number} — {order.billing.first_name} {order.billing.last_name}
        </p>
        {slotLabel && <p className="mt-0.5 text-xs text-text-light">{slotLabel}</p>}
        <p className="mt-0.5 text-xs text-text-light">£{order.total} charged</p>
      </div>
      <div className="flex items-center gap-3">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleComplete}
          disabled={submitting}
          className="bg-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "5px" }}
        >
          {submitting ? "Completing…" : "Mark complete"}
        </button>
      </div>
    </div>
  );
}
