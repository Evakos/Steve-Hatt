import { describe, it, expect } from "vitest";
import { mapWooProductToProduct, mapWooVariationToSizeOption } from "./map-product";
import type { WooProduct, WooProductVariation } from "./types";

function metaEntries(fields: Record<string, string>): WooProduct["meta_data"] {
  return Object.entries(fields).map(([key, value]) => ({ key, value }));
}

const simpleWooProduct: WooProduct = {
  id: 42,
  name: "Oysters | Gillardeau",
  slug: "gillardeau-oysters",
  type: "simple",
  description: "The Rolls Royce of oysters.",
  short_description: "",
  sku: "OYS-GIL",
  price: "3.00",
  regular_price: "3.00",
  images: [{ src: "https://example.com/wp-content/uploads/gillardeau.jpg" }],
  categories: [{ id: 1, name: "Shellfish", slug: "shellfish" }],
  attributes: [],
  meta_data: metaEntries({
    _steve_hatt_price_type: "per-piece",
    _steve_hatt_tag: "Premium",
    _steve_hatt_origin: "Marennes-Oleron, France",
    _steve_hatt_sustainability: "Farmed sustainably in traditional claires.",
    _steve_hatt_storage: "Keep flat in the fridge.",
    _steve_hatt_preparation: JSON.stringify(["Opened (ready to eat)", "Unopened"]),
    _steve_hatt_featured_for: JSON.stringify(["christmas"]),
  }),
  stock_status: "instock",
};

describe("mapWooProductToProduct", () => {
  it("maps core WooCommerce fields", () => {
    const product = mapWooProductToProduct(simpleWooProduct);
    expect(product.wooId).toBe(42);
    expect(product.slug).toBe("gillardeau-oysters");
    expect(product.name).toBe("Oysters | Gillardeau");
    expect(product.category).toBe("Shellfish");
    expect(product.price).toBe(3);
    expect(product.image).toBe("https://example.com/wp-content/uploads/gillardeau.jpg");
  });

  it("reads Steve Hatt custom meta fields and formats a display label for per-piece pricing", () => {
    const product = mapWooProductToProduct(simpleWooProduct);
    expect(product.priceType).toBe("per-piece");
    expect(product.tag).toBe("Premium");
    expect(product.preparation).toEqual(["Opened (ready to eat)", "Unopened"]);
    expect(product.featuredFor).toEqual(["christmas"]);
    expect(product.priceLabel).toBe("£3.00 each");
  });

  it("formats a per-kg label when pricePerKg meta is set", () => {
    const wooProduct: WooProduct = {
      ...simpleWooProduct,
      meta_data: metaEntries({ _steve_hatt_price_type: "per-kg", _steve_hatt_price_per_kg: "35.9" }),
    };
    const product = mapWooProductToProduct(wooProduct);
    expect(product.pricePerKg).toBe(35.9);
    expect(product.priceLabel).toBe("£35.90/kg");
  });

  it("defaults missing custom meta safely instead of throwing", () => {
    const wooProduct: WooProduct = { ...simpleWooProduct, meta_data: [] };
    const product = mapWooProductToProduct(wooProduct);
    expect(product.tag).toBe("");
    expect(product.preparation).toEqual([]);
    expect(product.priceType).toBe("fixed");
  });

  it("maps variations into size options and formats a 'From £X' label", () => {
    const variations: WooProductVariation[] = [
      { id: 101, price: "45", regular_price: "45", attributes: [{ name: "Size", option: "Small (2-3kg)" }], meta_data: [] },
      { id: 102, price: "65", regular_price: "65", attributes: [{ name: "Size", option: "Medium (3-4kg)" }], meta_data: [] },
    ];
    const wooProduct: WooProduct = {
      ...simpleWooProduct,
      type: "variable",
      price: "45",
      meta_data: metaEntries({ _steve_hatt_price_type: "fixed" }),
    };
    const product = mapWooProductToProduct(wooProduct, variations);
    expect(product.sizeOptions).toEqual([
      { label: "Small (2-3kg)", price: 45, wooVariationId: 101 },
      { label: "Medium (3-4kg)", price: 65, wooVariationId: 102 },
    ]);
    expect(product.priceLabel).toBe("From £45.00");
  });
});

describe("mapWooVariationToSizeOption", () => {
  it("joins multiple attribute options into a single label", () => {
    const variation: WooProductVariation = {
      id: 7,
      price: "12.5",
      regular_price: "12.5",
      attributes: [{ name: "Size", option: "Large" }, { name: "Colour", option: "Red" }],
      meta_data: [],
    };
    expect(mapWooVariationToSizeOption(variation)).toEqual({ label: "Large Red", price: 12.5, wooVariationId: 7 });
  });
});
