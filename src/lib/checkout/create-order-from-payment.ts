import { dayNoteFor } from "./closing-note";
import { isTestOrderMode } from "@/lib/feature-flags";
import { getDayNotes, getOpeningDays } from "@/lib/site-settings";
import "server-only";
import { createWooOrder } from "@/lib/woocommerce/orders";
import { findOrCreateCustomerByEmail, updateCustomer } from "@/lib/woocommerce/customers";
import type { WooOrder, WooOrderInput } from "@/lib/woocommerce/types";
import { repriceCheckoutRequest, type RepricedOrder } from "./reprice";
import type { CheckoutRequest } from "./schema";

/**
 * Creates the real WooCommerce order once Cardstream has *authorised* (not captured) payment.
 * Fish is priced by weight, so the amount authorised here is only an estimate - the card is
 * held, not charged. The order is created as "on-hold" (WooCommerce's built-in "awaiting
 * action" status) with set_paid: false; staff confirm the actual weighed amount later via the
 * /admin capture page, which calls captureSale and only then marks the order paid.
 *
 * Reprices server-side first (never trusts client-implied totals) and tags the order with our
 * own `orderRef` (in addition to Cardstream's transaction id) so the webhook handler / capture
 * page can look it up idempotently - see src/app/api/webhooks/pay360/route.ts.
 */
export async function createOrderFromPayment(
  checkout: CheckoutRequest,
  transactionId: string,
  orderRef: string,
  sessionCustomerId?: number | null,
  opts?: { paid?: boolean; awaitingPayment?: boolean; requestJson?: string }
): Promise<{ order: WooOrder; repriced: RepricedOrder }> {
  const repriced = await repriceCheckoutRequest(checkout);
  const { customer, fulfilment } = checkout;
  // A note staff attached to this date in the admin, such as an early closing time.
  const dayNote = dayNoteFor(fulfilment.slot.date, await getDayNotes(), await getOpeningDays());
  const testOrder = await isTestOrderMode();

  const billing = {
    first_name: customer.firstName,
    last_name: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address_1: customer.address?.line1,
    address_2: customer.address?.line2,
    city: customer.address?.city,
    postcode: customer.address?.postcode ?? fulfilment.postcode,
    country: "GB",
  };

  // Every order is tied to a real WooCommerce customer account - found by email if they've
  // ordered before, created silently otherwise (see woocommerce/customers.ts). This is just data
  // association, not a login: it does NOT sign the browser in. Actually accessing the account
  // still requires clicking the magic-link email, which is what proves they own that inbox -
  // skipping that check here would let anyone view a stranger's saved address/order history
  // just by typing their email at checkout. sessionCustomerId (derived server-side from the
  // session cookie by the caller, never trust a client-supplied id) short-circuits the lookup
  // when they're already signed in.
  //
  // findOrCreateCustomerByEmail returns undefined for an email that already belongs to a
  // non-customer WordPress user (e.g. a shop_manager/administrator) - there's no real customer
  // to link to in that case, so the order just proceeds without one, same as any other guest
  // checkout (see WooOrderInput.customer_id).
  const customerId = sessionCustomerId ?? (await findOrCreateCustomerByEmail(customer.email))?.id;
  // Keeps the saved profile current with whatever they just typed - this app only tracks one
  // address per account (no multiple-address book), so "most recent checkout" is the definition
  // of "current" here.
  if (customerId) {
    await updateCustomer(customerId, {
      email: customer.email,
      first_name: customer.firstName,
      last_name: customer.lastName,
      billing,
    });
  }

  const paid = opts?.paid === true;
  // Created before the customer pays on Pay360's page: pending, no transaction yet, and the whole
  // checkout request kept on the order so it can be finished once Pay360 confirms (no database).
  const awaiting = opts?.awaitingPayment === true;

  const orderInput: WooOrderInput = {
    status: awaiting ? "pending" : paid ? "processing" : "on-hold",
    set_paid: paid,
    transaction_id: awaiting ? undefined : transactionId,
    payment_method: "cardstream",
    payment_method_title: awaiting
      ? "Card (Pay360) - awaiting payment"
      : paid
        ? "Card (Cardstream/Pay360) - paid in full"
        : "Card (Cardstream/Pay360) - authorised, pending capture",
    customer_id: customerId,
    billing,
    shipping: fulfilment.type === "delivery" ? billing : undefined,
    line_items: repriced.lineItems.map((item) => ({
      product_id: item.wooProductId,
      variation_id: item.wooVariationId,
      quantity: item.quantity,
      meta_data: [
        { key: "Preparation", value: item.preparation },
        ...(item.weight > 0 ? [{ key: "Weight (estimated)", value: `${item.weight}kg` }] : []),
        // Staff re-price each line by hand at capture time (see capture-order-card.tsx) after the
        // real weigh-in - this is the rate that produced the estimate above, so a Christmas order's
        // per-product Christmas price (if any) stays visible instead of silently reverting to the
        // normal price once nobody but this order remembers it was ever applied.
        { key: "Unit price applied", value: `£${item.unitPrice.toFixed(2)}${fulfilment.slot.isChristmas ? " (Christmas)" : ""}` },
      ],
    })),
    shipping_lines:
      fulfilment.type === "delivery"
        ? [{ method_id: "flat_rate", method_title: "Local delivery", total: repriced.deliveryFee.toFixed(2) }]
        : undefined,
    ...(testOrder ? { customer_note: "TEST ORDER: placed while test mode was on. Do not prepare or fulfil." } : {}),
    meta_data: [
      { key: "_checkout_order_ref", value: orderRef },
      ...(testOrder ? [{ key: "TEST ORDER", value: "Yes. Placed while test mode was on, do not fulfil." }, { key: "_test_order", value: "yes" }] : []),
      { key: "_checkout_slot_label", value: fulfilment.slot.label },
      { key: "_checkout_slot_date", value: fulfilment.slot.date },
      ...(dayNote ? [{ key: "Closing time", value: dayNote }] : []),
      { key: "_checkout_is_christmas", value: String(fulfilment.slot.isChristmas) },
      { key: "_checkout_fulfilment_type", value: fulfilment.type },
      ...(awaiting ? [] : [{ key: "_cardstream_transaction_id", value: transactionId }]),
      { key: "_cardstream_authorised_amount", value: repriced.total.toFixed(2) },
      { key: "_cardstream_capture_status", value: awaiting ? "awaiting_payment" : paid ? "captured" : "pending" },
      ...(awaiting
        ? [
            { key: "_checkout_awaiting_payment", value: "yes" },
            { key: "_checkout_request", value: opts?.requestJson ?? "" },
          ]
        : []),
    ],
  };

  const order = await createWooOrder(orderInput);
  return { order, repriced };
}
