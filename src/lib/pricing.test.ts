import { describe, it, expect } from "vitest";
import { computeUnitPrice } from "./pricing";

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
});
