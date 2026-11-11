import type { WooOrder } from "@/lib/woocommerce/types";
import { DeliveryBox, Field, OrderBody, OrderItems, OrderTile, OrderTop, orderMeta } from "./order-parts";

// Mirrors AUTH_LEAD_DAYS in src/app/api/cron/reauthorise-preorders/route.ts - used here only to
// describe the schedule to staff, not to make any decision.
const AUTH_LEAD_DAYS = 5;

interface Props {
  order: WooOrder;
}

/** Read-only - staff don't act on these directly. The cron job authorises them automatically;
 * this exists so a pending pre-order (or a failed auto-charge) is visible before/without staff
 * having to go looking for it. See src/lib/checkout/create-preorder-from-verification.ts. */
export default function PreOrderStatusCard({ order }: Props) {
  const slotLabel = orderMeta(order, "_checkout_slot_label") as string | undefined;
  const slotDateStr = orderMeta(order, "_checkout_slot_date") as string | undefined;
  const estimatedAmount = orderMeta(order, "_cardstream_estimated_amount") as string | undefined;
  const preauthStatus = orderMeta(order, "_cardstream_preauth_status") as string | undefined;
  const failureReason = orderMeta(order, "_cardstream_preauth_failure_reason") as string | undefined;

  const daysUntilSlot = slotDateStr
    ? Math.ceil((new Date(slotDateStr).getTime() - new Date().getTime()) / 86_400_000)
    : null;
  const daysUntilAuth = daysUntilSlot !== null ? daysUntilSlot - AUTH_LEAD_DAYS : null;
  const failed = preauthStatus === "auth_failed";

  return (
    <OrderTile tone={failed ? "alert" : "normal"}>
      <OrderTop order={order} />
      <OrderBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label="When">
            <span className="font-medium">{slotLabel ?? "Not set"}</span>
          </Field>
          <Field label="Estimated total" className="text-right">
            <span className="text-base font-semibold">£{Number(estimatedAmount ?? order.total).toFixed(2)}</span>
          </Field>
        </div>
        <DeliveryBox order={order} />
        <OrderItems order={order} />
        <Field label="Card status">
          {failed ? (
            <span className="font-medium text-red-600">
              Declined on the scheduled charge{failureReason ? `, ${failureReason}` : ""}. The customer has been emailed
              to get in touch. Needs follow-up.
            </span>
          ) : (
            <span>
              Card verified. It will be charged automatically{" "}
              {daysUntilAuth !== null
                ? daysUntilAuth > 0
                  ? `in ${daysUntilAuth} day${daysUntilAuth === 1 ? "" : "s"} (${AUTH_LEAD_DAYS} days before delivery)`
                  : "any time now"
                : "closer to the delivery date"}
              .
            </span>
          )}
        </Field>
      </OrderBody>
    </OrderTile>
  );
}
