import "server-only";
import { createWooOrder } from "@/lib/woocommerce/orders";
import { findOrCreateCustomerByEmail, updateCustomer } from "@/lib/woocommerce/customers";
import type { WooOrder, WooOrderInput } from "@/lib/woocommerce/types";
import { repriceCheckoutRequest, type RepricedOrder } from "./reprice";
import type { CheckoutRequest } from "./schema";

/**
 * Creates the WooCommerce order for a Christmas pre-order once Cardstream has *verified* (not
 * authorised) the card — see VerifyCardResult in src/lib/cardstream/types.ts. No hold is placed
 * and no 7-day authorisation clock starts here: Christmas pre-orders can be placed from 1st
 * November for delivery on 23rd/24th December, far longer than an authorisation would survive.
 *
 * The order is created as WooCommerce's "pending" status — its own built-in "order received, no
 * payment yet" meaning, which is exactly true here — with the reusable merchant card token
 * stashed in meta. src/app/api/cron/reauthorise-preorders/route.ts spends that token a few days
 * before the delivery slot to place the real hold (status -> "on-hold", same as a normal order's
 * create-order-from-payment.ts outcome), at which point it joins the ordinary /admin/orders
 * capture queue with no special handling needed.
 *
 * Deliberately a separate function rather than sharing create-order-from-payment.ts with
 * branching — the status, payment meta, and what's known at creation time (a card token instead
 * of a transaction id and authorised amount) differ throughout.
 */
export async function createPreOrderFromVerification(
  checkout: CheckoutRequest,
  cardToken: string,
  orderRef: string,
  sessionCustomerId?: number | null
): Promise<{ order: WooOrder; repriced: RepricedOrder }> {
  const repriced = await repriceCheckoutRequest(checkout);
  const { customer, fulfilment } = checkout;

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

  // Same customer-association logic as create-order-from-payment.ts — see its comments for why
  // this doesn't sign the browser in and why updateCustomer keeps the saved profile current.
  const customerId = sessionCustomerId ?? (await findOrCreateCustomerByEmail(customer.email)).id;
  await updateCustomer(customerId, {
    email: customer.email,
    first_name: customer.firstName,
    last_name: customer.lastName,
    billing,
  });

  const orderInput: WooOrderInput = {
    status: "pending",
    set_paid: false,
    payment_method: "cardstream",
    payment_method_title: "Card (Cardstream/Pay360) — verified, auto-authorisation pending",
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
      ],
    })),
    shipping_lines:
      fulfilment.type === "delivery"
        ? [{ method_id: "flat_rate", method_title: "Local delivery", total: repriced.deliveryFee.toFixed(2) }]
        : undefined,
    meta_data: [
      { key: "_checkout_order_ref", value: orderRef },
      { key: "_checkout_slot_label", value: fulfilment.slot.label },
      // ISO date string — lets the cron job compute "days until delivery" per order instead of
      // hardcoding the 23rd/24th, so it generalises to whatever slot dates the storefront offers.
      { key: "_checkout_slot_date", value: fulfilment.slot.date },
      { key: "_checkout_is_christmas", value: String(fulfilment.slot.isChristmas) },
      { key: "_checkout_fulfilment_type", value: fulfilment.type },
      { key: "_cardstream_card_token", value: cardToken },
      { key: "_cardstream_estimated_amount", value: repriced.total.toFixed(2) },
      { key: "_cardstream_preauth_status", value: "awaiting_scheduled_auth" },
    ],
  };

  const order = await createWooOrder(orderInput);
  return { order, repriced };
}
