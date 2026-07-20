import { describe, it, expect } from "vitest";
import { lineTotal, type CartItem } from "./cart-context";
import type { Product } from "./products";

const product: Product = {
  slug: "test-product",
  name: "Test Product",
  category: "Test",
  price: 10,
  priceLabel: "£10.00",
  pricePerKg: 0,
  weight: "",
  image: "",
  tag: "",
  description: "",
  preparation: [],
  origin: "",
  sustainability: "",
  storage: "",
  wooId: 1,
};

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "test-id",
    product,
    quantity: 1,
    weight: 0,
    preparation: "",
    unitPrice: 10,
    ...overrides,
  };
}

describe("lineTotal", () => {
  it("multiplies the true per-unit price by quantity", () => {
    expect(lineTotal(makeItem({ unitPrice: 10, quantity: 3 }))).toBe(30);
  });

  it("is independent across items with different quantities of the same unit price", () => {
    const a = makeItem({ unitPrice: 5, quantity: 2 });
    const b = makeItem({ unitPrice: 5, quantity: 4 });
    expect(lineTotal(a)).toBe(10);
    expect(lineTotal(b)).toBe(20);
  });
});
