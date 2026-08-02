import type { Product, SizeOption } from "@/lib/products";
import type { WooProduct, WooProductVariation } from "./types";

/**
 * Steve Hatt's product data model needs several fields WooCommerce core has no concept of
 * (per-kg pricing, prep options, sustainability copy, Christmas featuring). Until the fresh
 * WordPress instance's product data model is finalised (see migration plan), these are read
 * from WooCommerce custom meta fields with the key names below. Missing meta defaults safely
 * rather than throwing, since the exact WP-side field names may still change.
 */
const META_KEYS = {
  pricePerKg: "_steve_hatt_price_per_kg",
  priceType: "_steve_hatt_price_type", // "per-kg" | "per-piece" | "fixed"
  tag: "_steve_hatt_tag",
  preparation: "_steve_hatt_preparation", // JSON string array
  origin: "_steve_hatt_origin",
  sustainability: "_steve_hatt_sustainability",
  storage: "_steve_hatt_storage",
  featuredFor: "_steve_hatt_featured_for", // JSON string array
  excludedFromChristmas: "_steve_hatt_excluded_from_christmas", // "true" | "false"
  preOrderDelivery: "_steve_hatt_pre_order_delivery",
} as const;

/**
 * The WooCommerce REST API runs `description` through `wpautop` on output, wrapping plain text
 * in `<p>` tags (and turning blank lines into separate paragraphs) — regardless of whether the
 * content was written as HTML or plain text. This app always treats description as plain text
 * (rendered directly in JSX, and reused verbatim as the page's meta description), so strip that
 * formatting back out rather than rendering literal "<p>" characters or shipping HTML in a meta tag.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .trim();
}

function readMeta(metaData: WooProduct["meta_data"], key: string): string {
  const entry = metaData.find((m) => m.key === key);
  return typeof entry?.value === "string" ? entry.value : "";
}

function readMetaJsonArray(metaData: WooProduct["meta_data"], key: string): string[] {
  const raw = readMeta(metaData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function mapWooVariationToSizeOption(variation: WooProductVariation): SizeOption {
  const label = variation.attributes.map((a) => a.option).join(" ") || `Variation ${variation.id}`;
  return {
    label,
    price: Number.parseFloat(variation.price) || 0,
    wooVariationId: variation.id,
  };
}

function formatPriceLabel(product: Product): string {
  if (product.priceType === "per-kg") return `£${product.pricePerKg.toFixed(2)}/kg`;
  if (product.priceType === "per-piece") return `£${product.price.toFixed(2)} each`;
  if (product.sizeOptions && product.sizeOptions.length > 0) return `From £${product.price.toFixed(2)}`;
  return `£${product.price.toFixed(2)}`;
}

export function mapWooProductToProduct(wooProduct: WooProduct, variations: WooProductVariation[] = []): Product {
  const priceTypeRaw = readMeta(wooProduct.meta_data, META_KEYS.priceType);
  const priceType: Product["priceType"] =
    priceTypeRaw === "per-kg" || priceTypeRaw === "per-piece" || priceTypeRaw === "fixed" ? priceTypeRaw : "fixed";

  const sizeOptions = variations.length > 0 ? variations.map(mapWooVariationToSizeOption) : undefined;

  const base: Product = {
    wooId: wooProduct.id,
    slug: wooProduct.slug,
    name: wooProduct.name,
    category: wooProduct.categories[0]?.name ?? "",
    price: Number.parseFloat(wooProduct.price || wooProduct.regular_price) || 0,
    priceLabel: "",
    pricePerKg: Number.parseFloat(readMeta(wooProduct.meta_data, META_KEYS.pricePerKg)) || 0,
    weight: "",
    image: wooProduct.images[0]?.src ?? "",
    tag: readMeta(wooProduct.meta_data, META_KEYS.tag),
    description: stripHtml(wooProduct.description),
    preparation: readMetaJsonArray(wooProduct.meta_data, META_KEYS.preparation),
    origin: readMeta(wooProduct.meta_data, META_KEYS.origin),
    sustainability: readMeta(wooProduct.meta_data, META_KEYS.sustainability),
    storage: readMeta(wooProduct.meta_data, META_KEYS.storage),
    sizeOptions,
    priceType,
    featuredFor: readMetaJsonArray(wooProduct.meta_data, META_KEYS.featuredFor),
    excludedFromChristmas: readMeta(wooProduct.meta_data, META_KEYS.excludedFromChristmas) === "true",
    preOrderDelivery: readMeta(wooProduct.meta_data, META_KEYS.preOrderDelivery) || undefined,
  };

  return { ...base, priceLabel: formatPriceLabel(base) };
}
