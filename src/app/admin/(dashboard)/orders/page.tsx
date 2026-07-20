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
    <>
      {christmasPreOrders.length > 0 && (
        <>
          <h2 className="font-serif text-2xl font-bold text-navy">Christmas pre-orders</h2>
          <p className="mt-1 text-sm text-text-light">
            Card verified but no hold placed yet — a scheduled job authorises these automatically a few days
            before delivery, then they move to the queue below like any other order. Nothing for you to do
            here unless one is flagged as failed.
          </p>
          <div className="mt-6 space-y-3">
            {christmasPreOrders.map((order) => (
              <PreOrderStatusCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}

      <h1 className={`font-serif text-2xl font-bold text-navy ${christmasPreOrders.length > 0 ? "mt-12" : ""}`}>
        Orders awaiting capture
      </h1>
      <p className="mt-1 text-sm text-text-light">
        Card is authorised (held) but not charged for these — enter the final weighed price per item, then
        capture to actually take payment for the confirmed amount. Holds expire 7 days after authorisation,
        so capture the oldest orders (shown first below) first.
      </p>

      {pendingCapture.length === 0 ? (
        <p className="mt-10 text-center text-sm text-text-light">No orders awaiting capture right now.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {pendingCapture.map((order) => (
            <CaptureOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      <h2 className="mt-12 font-serif text-2xl font-bold text-navy">Orders being prepared</h2>
      <p className="mt-1 text-sm text-text-light">
        Charged and being prepared — mark complete once the order has been collected or delivered.
      </p>

      {processing.length === 0 ? (
        <p className="mt-10 text-center text-sm text-text-light">No orders being prepared right now.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {processing.map((order) => (
            <CompleteOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </>
  );
}
