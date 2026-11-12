import Link from "next/link";
import type { WooOrder } from "@/lib/woocommerce/types";
import { orderMeta } from "./order-parts";

/** Sort options for the order grid. The chosen one lives in the URL (?sort=...), so it survives a
 * refresh and needs no client-side code. */
export const SORT_OPTIONS = [
  { id: "oldest", label: "Oldest first" },
  { id: "newest", label: "Newest first" },
  { id: "date", label: "Delivery or collection date" },
  { id: "name", label: "Customer A to Z" },
  { id: "delivery", label: "Delivery first" },
  { id: "collection", label: "Collection first" },
  { id: "christmas", label: "Christmas first" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function parseSort(value: string | string[] | undefined): SortId {
  const v = Array.isArray(value) ? value[0] : value;
  return SORT_OPTIONS.find((o) => o.id === v)?.id ?? "oldest";
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** When the order is due, as a timestamp. New orders store the slot date; older ones only have a
 * label like "Tue 24 December · Morning (9am-12pm)", so read the day and month from that and pick
 * the year that puts it closest to when the order was placed. Orders with neither sort last. */
function dueTime(order: WooOrder): number {
  const stored = orderMeta(order, "_checkout_slot_date");
  if (typeof stored === "string") {
    const t = new Date(stored).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const label = orderMeta(order, "_checkout_slot_label");
  const m = typeof label === "string" ? label.match(/(\d{1,2})\s+([A-Za-z]{3})/) : null;
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
  if (m && month >= 0) {
    const placed = new Date(order.date_created);
    let candidate = new Date(Date.UTC(placed.getUTCFullYear(), month, Number(m[1])));
    // A December slot on an order placed in January is last year's, a January slot on a December
    // order is next year's.
    if (candidate.getTime() < placed.getTime() - 30 * 86_400_000) {
      candidate = new Date(Date.UTC(placed.getUTCFullYear() + 1, month, Number(m[1])));
    }
    return candidate.getTime();
  }
  return Number.POSITIVE_INFINITY;
}

const placedTime = (o: WooOrder) => new Date(o.date_created).getTime();
const customerName = (o: WooOrder) => `${o.billing.first_name} ${o.billing.last_name}`.trim().toLowerCase();
const isDelivery = (o: WooOrder) => orderMeta(o, "_checkout_fulfilment_type") === "delivery";
const isChristmas = (o: WooOrder) => orderMeta(o, "_checkout_is_christmas") === "true";

/** Returns a sorted copy. Ties fall back to oldest first so the order is always stable. */
export function sortOrders(orders: WooOrder[], sort: SortId): WooOrder[] {
  const byPlaced = (a: WooOrder, b: WooOrder) => placedTime(a) - placedTime(b);
  const compare: Record<SortId, (a: WooOrder, b: WooOrder) => number> = {
    oldest: byPlaced,
    newest: (a, b) => placedTime(b) - placedTime(a),
    date: (a, b) => dueTime(a) - dueTime(b) || byPlaced(a, b),
    name: (a, b) => customerName(a).localeCompare(customerName(b), "en-GB") || byPlaced(a, b),
    delivery: (a, b) => Number(isDelivery(b)) - Number(isDelivery(a)) || byPlaced(a, b),
    collection: (a, b) => Number(isDelivery(a)) - Number(isDelivery(b)) || byPlaced(a, b),
    christmas: (a, b) => Number(isChristmas(b)) - Number(isChristmas(a)) || byPlaced(a, b),
  };
  return [...orders].sort(compare[sort]);
}

/** A row of links, one per option, with the current choice filled in. */
export function SortBar({ current }: { current: SortId }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-light">Sort by</span>
      {SORT_OPTIONS.map((o) => (
        <Link
          key={o.id}
          href={o.id === "oldest" ? "/admin/orders" : `/admin/orders?sort=${o.id}`}
          aria-current={o.id === current ? "true" : undefined}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            o.id === current ? "bg-navy text-white" : "border border-border bg-white text-navy hover:bg-cream"
          }`}
          style={{ borderRadius: "999px" }}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
