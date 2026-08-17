import "server-only";
import { getProductForPricing } from "@/lib/woocommerce/products";
import { computeUnitPrice } from "@/lib/pricing";
import { getChristmasPremiumPercent } from "@/lib/feature-flags";
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
  /** 0 unless this is a Christmas order and a premium is currently configured — see
   * getChristmasPremiumPercent. Surfaced so callers (order emails) can disclose it rather than
   * customers just seeing an unexplained higher total. */
  christmasPremiumPercent: number;
}

/**
 * Recomputes every line's price from WooCommerce, ignoring any price implied by the client.
 * This is the fix for the price-tampering gap a real payment integration must close — the old
 * fake checkout had nothing to tamper with, since nothing was ever charged.
 *
 * Christmas orders get a seasonal percentage premium applied here, on the price itself — never
 * shown as a separate "Christmas price" on the shop/product pages (see getChristmasPremiumPercent
 * for why: one catalogue, one price per product, the premium only exists at checkout).
 */
export async function repriceCheckoutRequest(checkout: CheckoutRequest): Promise<RepricedOrder> {
  const christmasPremiumPercent = checkout.fulfilment.slot.isChristmas ? await getChristmasPremiumPercent() : 0;
  const premiumMultiplier = 1 + christmasPremiumPercent / 100;

  const lineItems = await Promise.all(
    checkout.items.map(async (item) => {
      const pricing = await getProductForPricing(item.wooProductId, item.wooVariationId);
      if (!pricing) {
        throw new Error(`Product ${item.wooProductId} not found while repricing checkout`);
      }
      // Rounded to the penny — repeatedly compounding an unrounded percentage into money values
      // downstream (line totals, subtotal, capture amounts) would otherwise drift by fractions
      // of a penny and show up as odd totals.
      const unitPrice = Math.round(computeUnitPrice(pricing, item.weight) * premiumMultiplier * 100) / 100;
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

  return { lineItems, subtotal, deliveryFee, total: subtotal + deliveryFee, christmasPremiumPercent };
}
