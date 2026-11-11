import { Snowflake, Store, Truck } from "lucide-react";
import type { ReactNode } from "react";
import type { WooOrder } from "@/lib/woocommerce/types";

/** Shared building blocks for the order tiles on /admin/orders, so every tile labels the same
 * things the same way: a coloured Delivery/Collection bar on top, then small capitalised labels
 * (When, Deliver to, Items...) above each value. */

export function orderMeta(order: WooOrder, key: string) {
  return order.meta_data.find((m) => m.key === key)?.value;
}

/** Outer shell for a tile. The coloured bar is clipped to the rounded corners. */
export function OrderTile({ children, tone = "normal" }: { children: ReactNode; tone?: "normal" | "alert" }) {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden border bg-white shadow-sm ${tone === "alert" ? "border-red-300" : "border-border"}`}
      style={{ borderRadius: "12px" }}
    >
      {children}
    </div>
  );
}

/** Coloured bar (Delivery or Collection, plus Christmas or Standard) with the order number and
 * customer name underneath. */
export function OrderTop({ order }: { order: WooOrder }) {
  const isDelivery = orderMeta(order, "_checkout_fulfilment_type") === "delivery";
  const isChristmas = orderMeta(order, "_checkout_is_christmas") === "true";
  const name = `${order.billing.first_name} ${order.billing.last_name}`.trim();

  return (
    <>
      <div
        className={`flex items-center justify-between gap-2 px-3.5 py-2 text-white ${isDelivery ? "bg-lobster" : "bg-[#2a5f8f]"}`}
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          {isDelivery ? <Truck className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
          {isDelivery ? "Delivery" : "Collection"}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold ${isChristmas ? "bg-white text-[#1a3a2a]" : "bg-white/20 text-white"}`}
          style={{ borderRadius: "999px" }}
        >
          {isChristmas && <Snowflake className="h-3 w-3" />}
          {isChristmas ? "Christmas order" : "Standard order"}
        </span>
      </div>
      <div className="px-3.5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-light">Order #{order.number}</p>
        <p className="text-base font-semibold leading-tight text-navy">{name || "No name"}</p>
      </div>
    </>
  );
}

/** Padded body area under OrderTop. */
export function OrderBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col gap-3 px-3.5 pb-3.5 pt-3">{children}</div>;
}

/** A small capitalised label above a value. */
export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-light">{label}</p>
      <div className="mt-0.5 text-sm text-navy">{children}</div>
    </div>
  );
}

/** Delivery address and phone, shown only on delivery orders so whoever is driving has everything
 * on the tile. Collection orders show nothing here. */
export function DeliveryBox({ order }: { order: WooOrder }) {
  if (orderMeta(order, "_checkout_fulfilment_type") !== "delivery") return null;
  const a = order.shipping && order.shipping.address_1 ? order.shipping : order.billing;
  const lines = [a.address_1, a.address_2, a.city, a.postcode].filter((v): v is string => Boolean(v && v.trim()));
  return (
    <div className="space-y-2 bg-lobster-light px-3 py-2.5" style={{ borderRadius: "10px" }}>
      <Field label="Deliver to">
        {lines.length > 0 ? (
          lines.map((line, i) => (
            <span key={i} className="block font-medium">
              {line}
            </span>
          ))
        ) : (
          <span className="font-medium text-red-600">No address recorded, check with the customer</span>
        )}
      </Field>
      {order.billing.phone && (
        <Field label="Phone">
          <span className="font-medium">{order.billing.phone}</span>
        </Field>
      )}
    </div>
  );
}

/** What was ordered: quantity, name and the estimated weight where there is one. */
export function OrderItems({ order }: { order: WooOrder }) {
  if (order.line_items.length === 0) return null;
  return (
    <Field label={`Items (${order.line_items.length})`}>
      <ul className="mt-1 divide-y divide-border border-y border-border">
        {order.line_items.map((li) => {
          const weight = li.meta_data.find((m) => m.key === "Weight (estimated)")?.value as string | undefined;
          return (
            <li key={li.id} className="flex items-baseline gap-2 py-1.5">
              <span className="w-7 shrink-0 font-semibold">{li.quantity}×</span>
              <span className="min-w-0">
                {li.name}
                {weight && <span className="block text-xs text-text-light">est. {weight}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </Field>
  );
}
