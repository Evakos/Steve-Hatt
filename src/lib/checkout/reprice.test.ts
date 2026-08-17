import { describe, it, expect, vi, afterEach } from "vitest";

const getProductForPricing = vi.fn();
const getChristmasPremiumPercent = vi.fn();

vi.mock("@/lib/woocommerce/products", () => ({ getProductForPricing }));
vi.mock("@/lib/feature-flags", () => ({ getChristmasPremiumPercent }));

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

  it("does not apply a premium on a standard order, even if one is configured", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined });
    getChristmasPremiumPercent.mockResolvedValue(10);

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: false }));

    expect(getChristmasPremiumPercent).not.toHaveBeenCalled();
    expect(result.christmasPremiumPercent).toBe(0);
    expect(result.lineItems[0].unitPrice).toBe(10);
    expect(result.subtotal).toBe(20);
  });

  it("applies the configured percentage premium on a Christmas order", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined });
    getChristmasPremiumPercent.mockResolvedValue(10);

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true }));

    expect(result.christmasPremiumPercent).toBe(10);
    expect(result.lineItems[0].unitPrice).toBe(11);
    expect(result.subtotal).toBe(22);
  });

  it("rounds the premium-adjusted unit price to the nearest penny", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 4.99, sizeOptionPrice: undefined });
    getChristmasPremiumPercent.mockResolvedValue(7.5);

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true }));

    // 4.99 * 1.075 = 5.36425 -> rounds to 5.36
    expect(result.lineItems[0].unitPrice).toBe(5.36);
  });

  it("is a no-op when no premium is configured, even on a Christmas order", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined });
    getChristmasPremiumPercent.mockResolvedValue(0);

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true }));

    expect(result.lineItems[0].unitPrice).toBe(10);
    expect(result.christmasPremiumPercent).toBe(0);
  });

  it("adds the delivery fee on top of the premium-adjusted subtotal", async () => {
    getProductForPricing.mockResolvedValue({ pricePerKg: 0, price: 10, sizeOptionPrice: undefined });
    getChristmasPremiumPercent.mockResolvedValue(10);

    const result = await repriceCheckoutRequest(baseCheckout({ isChristmas: true, type: "delivery" }));

    expect(result.deliveryFee).toBe(5);
    expect(result.total).toBe(27);
  });
});
