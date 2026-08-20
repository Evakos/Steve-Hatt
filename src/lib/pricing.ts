export interface PricingInput {
  pricePerKg: number;
  /** Base/fallback unit price for simple fixed or per-piece products. */
  price: number;
  /** Price of the selected size variation, if the product has size options. */
  sizeOptionPrice?: number;
  /**
   * Manual per-product Christmas override, set via the Products sheet's `christmas_price`
   * column (staff fill this in directly, same as previous years' separate Christmas price
   * sheet — see _steve_hatt_christmas_price in map-product.ts). Same units as whichever of
   * pricePerKg/price is actually in play for this product: a £/kg rate if priced by weight, a
   * flat price otherwise. Undefined or 0 means no Christmas price is set for this product, the
   * normal price applies even on a Christmas order.
   *
   * Not supported yet for weight/size-tiered (variation) products — sizeOptionPrice always wins
   * if present, see computeUnitPriceForOrder.
   */
  christmasPrice?: number;
  /** Per-product deposit for a Christmas order (£ per unit), from the sheet's "Christmas deposit"
   * column. Carried through repricing so checkout can sum it; never affects the unit price. */
  christmasDeposit?: number;
}

/** Single source of truth for turning product pricing data into a true per-unit price (never a
 * line total). Always the *normal* price — never Christmas-adjusted, this is what's shown
 * everywhere a customer browses (shop grid, product pages, mini-cart), which must never differ
 * from what's shown elsewhere in the catalogue. See computeUnitPriceForOrder for checkout. */
export function computeUnitPrice({ pricePerKg, price, sizeOptionPrice }: PricingInput, weight: number): number {
  if (pricePerKg > 0) return pricePerKg * weight;
  if (sizeOptionPrice !== undefined) return sizeOptionPrice;
  return price;
}

/**
 * Same priority as computeUnitPrice, but on a Christmas order this uses the product's manual
 * christmasPrice override (if one's set) in place of the normal pricePerKg/price. This is the
 * only place Christmas pricing is ever applied — never on a shop/product page, only here, at
 * checkout repricing, once a customer has actually chosen a Christmas order (see reprice.ts).
 */
export function computeUnitPriceForOrder(input: PricingInput, weight: number, isChristmas: boolean): number {
  const hasChristmasPrice = isChristmas && input.sizeOptionPrice === undefined && !!input.christmasPrice && input.christmasPrice > 0;
  if (!hasChristmasPrice) return computeUnitPrice(input, weight);
  return input.pricePerKg > 0 ? input.christmasPrice! * weight : input.christmasPrice!;
}
