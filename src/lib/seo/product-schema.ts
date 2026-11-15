import type { Product } from "@/lib/products";

const AVAILABILITY = {
  instock: "https://schema.org/InStock",
  outofstock: "https://schema.org/OutOfStock",
  onbackorder: "https://schema.org/BackOrder",
} as const;

const SELLER_NAME = "Steve Hatt Fishmongers";
const CURRENCY = "GBP";

const money = (amount: number) => amount.toFixed(2);

/**
 * Product structured data (schema.org JSON-LD) for a product page: the name, photo, description,
 * price and whether it is in stock, in the form Google reads so it can show price and availability
 * in search results. Describes the three ways the shop prices things: one price, a price per kg
 * (the customer picks a weight), and sizes with a price each (a range from lowest to highest).
 * The offer is left out altogether if the product has no price, rather than claiming a price of 0.
 */
export function buildProductJsonLd(product: Product) {
  const availability = AVAILABILITY[product.stockStatus ?? "instock"];
  const seller = { "@type": "Organization", name: SELLER_NAME };

  const sizePrices = (product.sizeOptions ?? []).map((s) => s.price).filter((p) => p > 0);

  let offers: Record<string, unknown> | undefined;
  if (sizePrices.length > 0) {
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: CURRENCY,
      lowPrice: money(Math.min(...sizePrices)),
      highPrice: money(Math.max(...sizePrices)),
      offerCount: sizePrices.length,
      availability,
      seller,
    };
  } else if (product.priceType === "per-kg" && product.pricePerKg > 0) {
    offers = {
      "@type": "Offer",
      priceCurrency: CURRENCY,
      price: money(product.pricePerKg),
      availability,
      seller,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: money(product.pricePerKg),
        priceCurrency: CURRENCY,
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "KGM" },
      },
    };
  } else if (product.price > 0) {
    offers = {
      "@type": "Offer",
      priceCurrency: CURRENCY,
      price: money(product.price),
      availability,
      seller,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image ? [product.image] : undefined,
    category: product.category || undefined,
    brand: { "@type": "Brand", name: SELLER_NAME },
    offers,
  };
}

/** JSON for a <script type="application/ld+json"> tag, with "<" escaped so product text can never close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
