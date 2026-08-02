import {
  getAllProducts as wooGetAllProducts,
  getProductBySlug as wooGetProductBySlug,
  getFeaturedProducts as wooGetFeaturedProducts,
} from "@/lib/woocommerce/products";

export interface SizeOption {
  label: string;
  price: number;
  /** WooCommerce variation id for this size, needed to reference it at checkout. */
  wooVariationId?: number;
}

export type Product = {
  slug: string;
  name: string;
  category: string;
  /** Numeric base/"from" price. Use `priceLabel` for display. */
  price: number;
  /** Formatted display string, e.g. "From £45.00", "£3.00 each", "£35.90/kg". */
  priceLabel: string;
  pricePerKg: number;
  weight: string;
  image: string;
  tag: string;
  description: string;
  preparation: string[];
  origin: string;
  sustainability: string;
  storage: string;
  /** Discrete size options with fixed prices, e.g. Small/Medium/Large lobster */
  sizeOptions?: SizeOption[];
  /** "per-kg" | "per-piece" | "fixed" — controls the selector shown on the product page */
  priceType?: "per-kg" | "per-piece" | "fixed";
  /** Seasons/events this product is featured for, e.g. ["christmas"] — editorial promotion
   * (which items appear in the homepage's "Christmas Pre-Orders" teaser), separate from whether
   * the product can actually be pre-ordered for Christmas at all (see excludedFromChristmas). */
  featuredFor?: string[];
  /** Almost every product can be pre-ordered for Christmas by default — this opts a specific
   * product OUT (e.g. something that can't be held that long, or won't be in stock). */
  excludedFromChristmas?: boolean;
  /** Optional date string for when pre-orders will be fulfilled/delivered */
  preOrderDelivery?: string;
  /** WooCommerce product id, needed to reference this product at checkout. */
  wooId: number;
};

/** All products, fetched server-side from WooCommerce (ISR-cached — see src/lib/woocommerce/products.ts). */
export async function getAllProducts(): Promise<Product[]> {
  return wooGetAllProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return wooGetProductBySlug(slug);
}

/** Get products featured for a specific season/event */
export async function getFeaturedProducts(feature: string): Promise<Product[]> {
  return wooGetFeaturedProducts(feature);
}
