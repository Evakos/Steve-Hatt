import { Store, Truck } from "lucide-react";
import type { WooOrder } from "@/lib/woocommerce/types";

/** The two things staff need to see at a glance on every order: Collection or Delivery, and
 * Christmas or a standard order. Read from the order's checkout meta. */
export default function OrderBadges({ order }: { order: WooOrder }) {
  const meta = (key: string) => order.meta_data.find((m) => m.key === key)?.value;
  const isDelivery = meta("_checkout_fulfilment_type") === "delivery";
  const isChristmas = meta("_checkout_is_christmas") === "true";

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium ${
          isDelivery ? "bg-lobster-light text-lobster" : "bg-[#e8f1f8] text-[#2a5f8f]"
        }`}
        style={{ borderRadius: "999px" }}
      >
        {isDelivery ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
        {isDelivery ? "Delivery" : "Collection"}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium ${
          isChristmas ? "bg-[#1a3a2a] text-white" : "bg-sand text-text-light"
        }`}
        style={{ borderRadius: "999px" }}
      >
        {isChristmas ? "🎄 Christmas order" : "Standard order"}
      </span>
    </div>
  );
}
