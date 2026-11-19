"use client";

import type { Product } from "@/lib/products";
import { useChristmasActive } from "@/lib/use-christmas-active";

/** The Christmas price of a product with a single price, as text like "£38.90/kg", or null when it has
 * none, is opted out of Christmas, is priced by size (each size has its own), or matches the normal price. */
export function christmasAmount(product: Product): string | null {
  const christmasPrice = product.christmasPrice;
  if (!christmasPrice || christmasPrice <= 0 || product.excludedFromChristmas) return null;
  if (product.sizeOptions && product.sizeOptions.length > 0) return null;
  const normal = product.priceType === "per-kg" ? product.pricePerKg : product.price;
  if (christmasPrice === normal) return null;
  const suffix = product.priceType === "per-kg" ? "/kg" : product.priceType === "per-piece" ? " each" : "";
  return `£${christmasPrice.toFixed(2)}${suffix}`;
}

/** Under a product's price on its page: "£x for Christmas orders", only while Christmas ordering is on. */
export default function ChristmasPriceLine({ product }: { product: Product }) {
  const active = useChristmasActive();
  const amount = christmasAmount(product);
  if (!active || !amount) return null;
  return <p className="mt-1 text-sm font-medium text-[#1a3a2a]">{amount} for Christmas orders</p>;
}
