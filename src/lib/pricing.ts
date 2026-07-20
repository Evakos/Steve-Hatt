export interface PricingInput {
  pricePerKg: number;
  /** Base/fallback unit price for simple fixed or per-piece products. */
  price: number;
  /** Price of the selected size variation, if the product has size options. */
  sizeOptionPrice?: number;
}

/** Single source of truth for turning product pricing data into a true per-unit price (never a line total). */
export function computeUnitPrice({ pricePerKg, price, sizeOptionPrice }: PricingInput, weight: number): number {
  if (pricePerKg > 0) return pricePerKg * weight;
  if (sizeOptionPrice !== undefined) return sizeOptionPrice;
  return price;
}
