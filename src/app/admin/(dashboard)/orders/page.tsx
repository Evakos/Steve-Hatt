import { listPendingCaptureOrders, listProcessingOrders, listPendingPreOrders } from "@/lib/woocommerce/orders";
import CaptureOrderCard from "./capture-order-card";
import CompleteOrderCard from "./complete-order-card";
import PreOrderStatusCard from "./preorder-status-card";

export default async function AdminOrdersPage() {
  const [pendingCapture, processing, pendingPreOrders] = await Promise.all([
    listPendingCaptureOrders(),
    listProcessingOrders(),
    listPendingPreOrders(),
  ]);
  const christmasPreOrders = pendingPreOrders.filter(
    (order) => order.meta_data.find((m) => m.key === "_checkout_is_christmas")?.value === "true"
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Orders</h1>
      <p className="mt-2 text-sm text-text-light">
        Paid orders ready to prepare. Older held orders or pending Christmas pre-orders show here only if there are any.
      </p>

      <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
        {christmasPreOrders.length > 0 && (
          <section className="border border-border bg-white p-6 md:col-span-2" style={{ borderRadius: "5px" }}>
            <SectionHeading title="Christmas pre-orders" count={christmasPreOrders.length} />
            <p className="mt-2 text-sm leading-relaxed text-text-light">
              Card verified but no hold placed yet. A scheduled job authorises these automatically a few days before
              delivery, then they move to the queue below like any other order. Nothing for you to do here unless one is
              flagged as failed.
            </p>
            <div className="mt-5 space-y-3">
              {christmasPreOrders.map((order) => (
                <PreOrderStatusCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Only shown when something is actually held, so the capture explanation never appears for nothing. */}
        {pendingCapture.length > 0 && (
        <section className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
          <SectionHeading title="Awaiting capture" count={pendingCapture.length} />
          <p className="mt-2 text-sm leading-relaxed text-text-light">
            The card is held but not charged. Enter the final weighed price per item, then capture to take payment for the
            confirmed amount. Holds expire 7 days after authorisation, so capture the oldest orders (shown first) first.
          </p>
          <div className="mt-5 space-y-4">
            {pendingCapture.map((order) => (
              <CaptureOrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
        )}

        <section
          className={`border border-border bg-white p-6 ${pendingCapture.length === 0 ? "md:col-span-2" : ""}`}
          style={{ borderRadius: "5px" }}
        >
          <SectionHeading title="Orders being prepared" count={processing.length} />
          <p className="mt-2 text-sm leading-relaxed text-text-light">
            Already charged and being prepared. Mark complete once the order has been collected or delivered.
          </p>
          {processing.length === 0 ? (
            <p className="mt-6 text-sm text-text-light">No orders being prepared right now.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {processing.map((order) => (
                <CompleteOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
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
