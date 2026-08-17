import { describe, it, expect, vi, afterEach } from "vitest";

const getProductForPricing = vi.fn();

vi.mock("@/lib/woocommerce/products", () => ({ getProductForPricing }));

const { repriceCheckoutRequest } = await import("./reprice");

function baseCheckout(overrides: { isChristmas?: boolean; type?: "delivery" | "collection" } = {}) {
  return {
    items: [
      { wooProductId: 1, quantity: 2, weight: 0, preparation: "Filleted", productName: "Cod" },
    ],
    fulfilment: {
      type: overrides.type ?? "delivery",
      slot: { date: new Date().toISOString(), label: "Test slot", isChristmas: overrides.isChristmas ?? false },
    },
    customer: { email: "jo@example.test", firstName: "Jo", lastName: "Bloggs", phone: "07000000000" },
    payment: { token: "tok" },
  } as Parameters<typeof repriceCheckoutRequest>[0];
}

describe("repriceCheckoutRequest", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses the normal price on a standard order, even if a Christmas price is set", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined, christmasPrice: 15 });

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: false }));

    expect(result.isChristmas).toBe(false);
    expect(result.lineItems[0].unitPrice).toBe(10);
    expect(result.subtotal).toBe(20);
  });

  it("uses the manual Christmas price on a Christmas order when one is set", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined, christmasPrice: 15 });

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true }));

    expect(result.isChristmas).toBe(true);
    expect(result.lineItems[0].unitPrice).toBe(15);
    expect(result.subtotal).toBe(30);
  });

  it("falls back to the normal price on a Christmas order when no Christmas price is set", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined, christmasPrice: undefined });

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true }));

    expect(result.lineItems[0].unitPrice).toBe(10);
  });

  it("applies a per-kg Christmas price against the real weight, same as normal pricing", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 20, price: 0, sizeOptionPrice: undefined, christmasPrice: 25 });

    const result = await repriceCheckoutRequest({
      ...baseCheckout({ isChristmas: true }),
      items: [{ wooProductId: 1, quantity: 1, weight: 0.5, preparation: "Whole", productName: "Salmon" }],
    });

    // 25/kg * 0.5kg = 12.50
    expect(result.lineItems[0].unitPrice).toBe(12.5);
  });

  it("never applies a Christmas price to a weight/size-tiered (variation) product", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 0, sizeOptionPrice: 60, christmasPrice: 75 });

    const result = await repriceCheckoutRequest({
      ...baseCheckout({ isChristmas: true }),
      items: [{ wooProductId: 1, wooVariationId: 36, quantity: 1, weight: 0, preparation: "Live", productName: "Lobster Live" }],
    });

    expect(result.lineItems[0].unitPrice).toBe(60);
  });

  it("adds the delivery fee on top of the repriced subtotal", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined, christmasPrice: 15 });

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true, type: "delivery" }));

    expect(result.deliveryFee).toBe(5);
    expect(result.total).toBe(35);
  });
});
