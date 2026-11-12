import { listPendingCaptureOrders, listProcessingOrders, listPendingPreOrders } from "@/lib/woocommerce/orders";
import type { WooOrder } from "@/lib/woocommerce/types";
import CaptureOrderCard from "./capture-order-card";
import CompleteOrderCard from "./complete-order-card";
import { SortBar, parseSort, sortOrders } from "./order-sort";
import PreOrderStatusCard from "./preorder-status-card";

// Every order is now charged in full at checkout, so there is nothing to hold and capture later.
// The "Awaiting capture" section is switched off; set this to true to bring it back.
const SHOW_AWAITING_CAPTURE = false;

// Orders sit in a responsive grid: as many tiles per row as the width allows (about 17rem each).
const GRID = "mt-4 grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string | string[] }>;
}) {
  const sort = parseSort((await searchParams).sort);
  const [pendingCapture, processingRaw, pendingPreOrders] = await Promise.all([
    SHOW_AWAITING_CAPTURE ? listPendingCaptureOrders() : Promise.resolve<WooOrder[]>([]),
    listProcessingOrders(),
    listPendingPreOrders(),
  ]);
  const processing = sortOrders(processingRaw, sort);
  const christmasPreOrders = sortOrders(
    pendingPreOrders.filter((order) => order.meta_data.find((m) => m.key === "_checkout_is_christmas")?.value === "true"),
    sort
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Orders</h1>
      <p className="mt-1 text-sm text-text-light">
        Paid orders ready to prepare. Pending Christmas pre-orders show here only if there are any.
      </p>
      <SortBar current={sort} />

      <div className="mt-5 space-y-5">
        {/* Only shown when something is actually held, so the capture explanation never appears for nothing. */}
        {pendingCapture.length > 0 && (
          <section className="border border-border bg-white p-5 shadow-sm" style={{ borderRadius: "16px" }}>
            <SectionHeading title="Awaiting capture" count={pendingCapture.length} />
            <p className="mt-1.5 text-xs leading-relaxed text-text-light">
              The card is held but not charged. Enter the final weighed price per item, then capture to take payment for
              the confirmed amount. Holds expire 7 days after authorisation, so capture the oldest orders (shown first)
              first.
            </p>
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3">
              {pendingCapture.map((order) => (
                <CaptureOrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        <section className="border border-border bg-white p-5 shadow-sm" style={{ borderRadius: "16px" }}>
          <SectionHeading title="Orders being prepared" count={processing.length} />
          <p className="mt-1.5 text-xs leading-relaxed text-text-light">
            Already charged and being prepared. Mark complete once the order has been collected or delivered.
          </p>
          {processing.length === 0 ? (
            <p className="mt-4 text-sm text-text-light">No orders being prepared right now.</p>
          ) : (
            <div className={GRID}>
              {processing.map((order) => (
                <CompleteOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>

        {christmasPreOrders.length > 0 && (
          <section className="border border-border bg-white p-5 shadow-sm" style={{ borderRadius: "16px" }}>
            <SectionHeading title="Christmas pre-orders" count={christmasPreOrders.length} />
            <p className="mt-1.5 text-xs leading-relaxed text-text-light">
              Card verified but no hold placed yet. A scheduled job authorises these automatically a few days before
              delivery, then they move to the queue above like any other order. Nothing for you to do here unless one is
              flagged as failed.
            </p>
            <div className={GRID}>
              {christmasPreOrders.map((order) => (
                <PreOrderStatusCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-medium text-navy">{title}</h2>
      <span className="bg-cream px-2.5 py-0.5 text-xs font-medium text-navy" style={{ borderRadius: "999px" }}>
        {count}
      </span>
    </div>
  );
}
