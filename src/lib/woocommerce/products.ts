import "server-only";
import { wooFetch } from "./client";
import { mapWooProductToProduct } from "./map-product";
import type { WooProduct, WooProductInput, WooProductVariation } from "./types";
import type { Product } from "@/lib/products";
import type { PricingInput } from "@/lib/pricing";

export const PRODUCTS_TAG = "woo-products";

async function fetchVariationsIfVariable(wooProduct: WooProduct): Promise<WooProductVariation[]> {
  if (wooProduct.type !== "variable") return [];
  return wooFetch<WooProductVariation[]>(`products/${wooProduct.id}/variations`, {
    searchParams: { per_page: 100 },
    next: { revalidate: 120, tags: [PRODUCTS_TAG] },
  });
}

export async function getAllProducts(): Promise<Product[]> {
  const wooProducts = await wooFetch<WooProduct[]>("products", {
    searchParams: { per_page: 100, status: "publish" },
    next: { revalidate: 120, tags: [PRODUCTS_TAG] },
  });

  return Promise.all(
    wooProducts.map(async (wp) => mapWooProductToProduct(wp, await fetchVariationsIfVariable(wp)))
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const matches = await wooFetch<WooProduct[]>("products", {
    searchParams: { slug },
    next: { revalidate: 120, tags: [PRODUCTS_TAG] },
  });
  const wooProduct = matches[0];
  if (!wooProduct) return undefined;
  return mapWooProductToProduct(wooProduct, await fetchVariationsIfVariable(wooProduct));
}

export async function getFeaturedProducts(feature: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.featuredFor?.includes(feature));
}

/** Used by the /admin/products sheet sync to write back name/price/status/description/meta. */
export async function updateWooProduct(id: number, input: WooProductInput): Promise<WooProduct> {
  return wooFetch<WooProduct>(`products/${id}`, { method: "PUT", body: input });
}

/**
 * Always-fresh (never cached) lookup used only for server-side repricing at checkout.
 * Deliberately bypasses the ISR-cached browsing path above — payment math must never trust a stale cache.
 * Returns raw pricing inputs (not a collapsed total) so the caller applies the same
 * `computeUnitPrice` priority logic used client-side, keeping pricing rules in one place.
 */
export async function getProductForPricing(
  wooProductId: number,
  wooVariationId?: number
): Promise<PricingInput | undefined> {
  const wooProduct = await wooFetch<WooProduct>(`products/${wooProductId}`, { next: { revalidate: 0 } });
  const pricePerKgMeta = wooProduct.meta_data.find((m) => m.key === "_steve_hatt_price_per_kg");
  const pricePerKg = typeof pricePerKgMeta?.value === "string" ? Number.parseFloat(pricePerKgMeta.value) || 0 : 0;

  if (wooVariationId) {
    const variation = await wooFetch<WooProductVariation>(`products/${wooProductId}/variations/${wooVariationId}`, {
      next: { revalidate: 0 },
    });
    return { pricePerKg, price: Number.parseFloat(wooProduct.price || wooProduct.regular_price) || 0, sizeOptionPrice: Number.parseFloat(variation.price) || 0 };
  }

  return { pricePerKg, price: Number.parseFloat(wooProduct.price || wooProduct.regular_price) || 0 };
}
