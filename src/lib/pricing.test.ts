import { describe, it, expect } from "vitest";
import { computeUnitPrice, computeUnitPriceForOrder } from "./pricing";

describe("computeUnitPrice", () => {
  it("uses pricePerKg * weight when the product is sold by weight", () => {
    expect(computeUnitPrice({ pricePerKg: 35.9, price: 0, sizeOptionPrice: undefined }, 0.2)).toBeCloseTo(7.18);
  });

  it("uses the selected size option's price when the product has size options", () => {
    expect(computeUnitPrice({ pricePerKg: 0, price: 0, sizeOptionPrice: 65 }, 0)).toBe(65);
  });

  it("falls back to the base price for simple fixed/per-piece products", () => {
    expect(computeUnitPrice({ pricePerKg: 0, price: 3, sizeOptionPrice: undefined }, 0)).toBe(3);
  });

  it("prioritises pricePerKg over a size option if both are somehow present", () => {
    expect(computeUnitPrice({ pricePerKg: 10, price: 5, sizeOptionPrice: 20 }, 1)).toBe(10);
  });

  it("ignores christmasPrice entirely — never shown outside checkout", () => {
    expect(computeUnitPrice({ pricePerKg: 0, price: 3, sizeOptionPrice: undefined, christmasPrice: 99 }, 0)).toBe(3);
  });
});

describe("computeUnitPriceForOrder", () => {
  it("behaves exactly like computeUnitPrice on a non-Christmas order", () => {
    expect(computeUnitPriceForOrder({ pricePerKg: 0, price: 3, sizeOptionPrice: undefined, christmasPrice: 99 }, 0, false)).toBe(3);
  });

  it("uses the flat christmasPrice on a Christmas order for a fixed-price product", () => {
    expect(computeUnitPriceForOrder({ pricePerKg: 0, price: 3, sizeOptionPrice: undefined, christmasPrice: 5 }, 0, true)).toBe(5);
  });

  it("uses christmasPrice as a £/kg rate against the real weight for weight-based products", () => {
    expect(computeUnitPriceForOrder({ pricePerKg: 35.9, price: 0, sizeOptionPrice: undefined, christmasPrice: 45 }, 0.2, true)).toBeCloseTo(9);
  });

  it("falls back to the normal price on a Christmas order when no christmasPrice is set", () => {
    expect(computeUnitPriceForOrder({ pricePerKg: 35.9, price: 0, sizeOptionPrice: undefined }, 0.2, true)).toBeCloseTo(7.18);
  });

  it("never applies christmasPrice to a weight/size-tiered product, even on a Christmas order", () => {
    expect(computeUnitPriceForOrder({ pricePerKg: 0, price: 0, sizeOptionPrice: 60, christmasPrice: 75 }, 0, true)).toBe(60);
  });
});
