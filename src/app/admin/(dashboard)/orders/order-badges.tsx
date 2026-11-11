import { Store, Truck } from "lucide-react";
import type { WooOrder } from "@/lib/woocommerce/types";

/** The two things staff need to see at a glance on every order: Collection or Delivery, and
 * Christmas or a standard order. Read from the order's checkout meta. Kept small so the order
 * tiles stay compact. */
export default function OrderBadges({ order }: { order: WooOrder }) {
  const meta = (key: string) => order.meta_data.find((m) => m.key === key)?.value;
  const isDelivery = meta("_checkout_fulfilment_type") === "delivery";
  const isChristmas = meta("_checkout_is_christmas") === "true";

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${
          isDelivery ? "bg-lobster-light text-lobster" : "bg-[#e8f1f8] text-[#2a5f8f]"
        }`}
        style={{ borderRadius: "999px" }}
      >
        {isDelivery ? <Truck className="h-3 w-3" /> : <Store className="h-3 w-3" />}
        {isDelivery ? "Delivery" : "Collection"}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${
          isChristmas ? "bg-[#1a3a2a] text-white" : "bg-sand text-text-light"
        }`}
        style={{ borderRadius: "999px" }}
      >
        {isChristmas ? "🎄 Christmas" : "Standard"}
      </span>
    </div>
  );
}

/** Delivery address and phone, shown only on delivery orders so whoever is driving has everything
 * on the tile. Collection orders show nothing here. */
export function OrderDeliveryDetails({ order }: { order: WooOrder }) {
  const isDelivery = order.meta_data.find((m) => m.key === "_checkout_fulfilment_type")?.value === "delivery";
  if (!isDelivery) return null;
  const a = order.shipping && order.shipping.address_1 ? order.shipping : order.billing;
  const lines = [a.address_1, a.address_2, a.city, a.postcode].filter((v): v is string => Boolean(v && v.trim()));
  return (
    <div className="mt-2 bg-lobster-light px-2.5 py-2 text-xs leading-snug text-navy" style={{ borderRadius: "10px" }}>
      <p>
        <span className="font-medium">Deliver to:</span>{" "}
        {lines.length > 0 ? lines.join(", ") : "No address recorded, check with the customer"}
      </p>
      {order.billing.phone && <p className="mt-0.5 text-text-light">Phone: {order.billing.phone}</p>}
    </div>
  );
}
