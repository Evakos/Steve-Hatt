import type { WooOrder } from "@/lib/woocommerce/types";
import OrderBadges from "./order-badges";

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
  const slotLabel = order.meta_data.find((m) => m.key === "_checkout_slot_label")?.value as string | undefined;
  const slotDateStr = order.meta_data.find((m) => m.key === "_checkout_slot_date")?.value as string | undefined;
  const estimatedAmount = order.meta_data.find((m) => m.key === "_cardstream_estimated_amount")?.value as
    | string
    | undefined;
  const preauthStatus = order.meta_data.find((m) => m.key === "_cardstream_preauth_status")?.value as
    | string
    | undefined;
  const failureReason = order.meta_data.find((m) => m.key === "_cardstream_preauth_failure_reason")?.value as
    | string
    | undefined;

  const daysUntilSlot = slotDateStr
    ? Math.ceil((new Date(slotDateStr).getTime() - new Date().getTime()) / 86_400_000)
    : null;
  const daysUntilAuth = daysUntilSlot !== null ? daysUntilSlot - AUTH_LEAD_DAYS : null;
  const failed = preauthStatus === "auth_failed";

  return (
    <div
      className={`border bg-cream p-4 text-sm ${failed ? "border-red-300" : "border-border"}`}
      style={{ borderRadius: "5px" }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-navy">
          Order #{order.number}, {order.billing.first_name} {order.billing.last_name}
        </span>
        <span className="text-sm text-text-light">Estimated: £{Number(estimatedAmount ?? order.total).toFixed(2)}</span>
      </div>
      <OrderBadges order={order} />
      {slotLabel && <p className="mt-2 text-sm font-medium text-navy">{slotLabel}</p>}
      {failed ? (
        <p className="mt-1 text-sm font-medium text-red-600">
          Card declined on scheduled charge{failureReason ? `, ${failureReason}` : ""}. Customer has been emailed
          to get in touch; needs follow-up.
        </p>
      ) : (
        <p className="mt-1 text-sm text-text-light">
          Card verified, will be charged automatically{" "}
          {daysUntilAuth !== null
            ? daysUntilAuth > 0
              ? `in ${daysUntilAuth} day${daysUntilAuth === 1 ? "" : "s"} (${AUTH_LEAD_DAYS} days before delivery)`
              : "any time now"
            : "closer to the delivery date"}
          .
        </p>
      )}
    </div>
  );
}
