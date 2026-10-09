import type { CheckoutRequest } from "./schema";

export interface DeliveryDetails {
  customerPhone: string;
  /** Present only for delivery orders. */
  deliveryAddress?: { lines: string[]; postcode: string };
}

/** What staff need to deliver an order (phone plus address), taken from the checkout request.
 * The address is omitted for collection orders. */
export function adminDeliveryFields(checkout: CheckoutRequest): DeliveryDetails {
  const { customer, fulfilment } = checkout;
  if (fulfilment.type !== "delivery") return { customerPhone: customer.phone };
  const a = customer.address;
  return {
    customerPhone: customer.phone,
    deliveryAddress: {
      lines: [a?.line1, a?.line2, a?.city].filter((v): v is string => Boolean(v && v.trim())),
      postcode: a?.postcode ?? fulfilment.postcode ?? "",
    },
  };
}
