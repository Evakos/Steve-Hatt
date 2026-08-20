import "server-only";
import { getProductForPricing } from "@/lib/woocommerce/products";
import { computeUnitPriceForOrder } from "@/lib/pricing";
import type { CheckoutRequest } from "./schema";

// Mirrors the client-side delivery fee shown in src/app/checkout/page.tsx - the delivery-step
// UI is out of scope for this project (see master plan), so this constant is duplicated rather
// than refactoring that page's local logic.
const DELIVERY_FEE = 5;

export interface RepricedLineItem {
  wooProductId: number;
  wooVariationId?: number;
  /** Client-supplied, for display only (e.g. order confirmation emails) - never used for
   * pricing, which is always recomputed from WooCommerce below. */
  productName: string;
  quantity: number;
  weight: number;
  preparation: string;
  unitPrice: number;
  lineTotal: number;
  /** Per-product Christmas deposit (£ per unit) - summed at checkout to derive the order deposit. */
  christmasDeposit?: number;
}

export interface RepricedOrder {
  lineItems: RepricedLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  isChristmas: boolean;
}

/**
 * Recomputes every line's price from WooCommerce, ignoring any price implied by the client.
 * This is the fix for the price-tampering gap a real payment integration must close - the old
 * fake checkout had nothing to tamper with, since nothing was ever charged.
 *
 * Christmas orders use each product's manual christmasPrice override where one's set (the
 * Products sheet's `christmas_price` column, staff-managed, same idea as previous years'
 * separate Christmas price sheet) - never a blanket percentage, and never shown as a second
 * price on the shop/product pages, only here, once a customer has actually chosen a Christmas
 * order. See computeUnitPriceForOrder for the full priority logic.
 *
 * NOTE: getChristmasPremiumPercent (src/lib/feature-flags.ts) still exists and is editable from
 * /admin/products, but is deliberately NOT applied here - kept as a dormant/experimental
 * mechanism, not the live one, per product decision. If it's ever reactivated, it should layer
 * on top of computeUnitPriceForOrder's result rather than replacing this per-product approach.
 */
export async function repriceCheckoutRequest(checkout: CheckoutRequest): Promise<RepricedOrder> {
  const isChristmas = checkout.fulfilment.slot.isChristmas;

  const lineItems = await Promise.all(
    checkout.items.map(async (item) => {
      const pricing = await getProductForPricing(item.wooProductId, item.wooVariationId);
      if (!pricing) {
        throw new Error(`Product ${item.wooProductId} not found while repricing checkout`);
      }
      const unitPrice = Math.round(computeUnitPriceForOrder(pricing, item.weight, isChristmas) * 100) / 100;
      return {
        wooProductId: item.wooProductId,
        wooVariationId: item.wooVariationId,
        productName: item.productName,
        quantity: item.quantity,
        weight: item.weight,
        preparation: item.preparation,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        christmasDeposit: pricing.christmasDeposit,
      };
    })
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = checkout.fulfilment.type === "delivery" ? DELIVERY_FEE : 0;

  return { lineItems, subtotal, deliveryFee, total: subtotal + deliveryFee, isChristmas };
}
