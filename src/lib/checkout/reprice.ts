import "server-only";
import { getProductForPricing } from "@/lib/woocommerce/products";
import { computeUnitPrice } from "@/lib/pricing";
import type { CheckoutRequest } from "./schema";

// Mirrors the client-side delivery fee shown in src/app/checkout/page.tsx — the delivery-step
// UI is out of scope for this project (see master plan), so this constant is duplicated rather
// than refactoring that page's local logic.
const DELIVERY_FEE = 5;

export interface RepricedLineItem {
  wooProductId: number;
  wooVariationId?: number;
  /** Client-supplied, for display only (e.g. order confirmation emails) — never used for
   * pricing, which is always recomputed from WooCommerce below. */
  productName: string;
  quantity: number;
  weight: number;
  preparation: string;
  unitPrice: number;
  lineTotal: number;
}

export interface RepricedOrder {
  lineItems: RepricedLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Recomputes every line's price from WooCommerce, ignoring any price implied by the client.
 * This is the fix for the price-tampering gap a real payment integration must close — the old
 * fake checkout had nothing to tamper with, since nothing was ever charged.
 */
export async function repriceCheckoutRequest(checkout: CheckoutRequest): Promise<RepricedOrder> {
  const lineItems = await Promise.all(
    checkout.items.map(async (item) => {
      const pricing = await getProductForPricing(item.wooProductId, item.wooVariationId);
      if (!pricing) {
        throw new Error(`Product ${item.wooProductId} not found while repricing checkout`);
      }
      const unitPrice = computeUnitPrice(pricing, item.weight);
      return {
        wooProductId: item.wooProductId,
        wooVariationId: item.wooVariationId,
        productName: item.productName,
        quantity: item.quantity,
        weight: item.weight,
        preparation: item.preparation,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    })
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = checkout.fulfilment.type === "delivery" ? DELIVERY_FEE : 0;

  return { lineItems, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
