import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

beforeAll(() => {
  process.env.WOOCOMMERCE_URL = "https://example.test";
  process.env.WOOCOMMERCE_CONSUMER_KEY = "ck_test";
  process.env.WOOCOMMERCE_CONSUMER_SECRET = "cs_test";
  process.env.CARDSTREAM_API_BASE_URL = "https://api.mite.pay360.com";
  process.env.CARDSTREAM_API_USERNAME = "user";
  process.env.CARDSTREAM_API_PASSWORD = "pass";
  process.env.CARDSTREAM_INSTALLATION_ID = "inst";
  process.env.CARDSTREAM_WEBHOOK_SECRET = "test-webhook-secret";
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.CARDSTREAM_MOCK = "true";
  process.env.RESEND_API_KEY = "re_test";
  process.env.ADMIN_NOTIFICATION_EMAIL = "admin@example.test";
  process.env.STAFF_PASSWORD = "test-staff-password";
  process.env.STAFF_SESSION_SECRET = "test-staff-session-secret";
  process.env.CUSTOMER_SESSION_SECRET = "test-customer-session-secret";
});

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  repricedResult.total = 42;
  repricedResult.subtotal = 42;
  repricedResult.deliveryFee = 0;
});

const flags = {
  getChristmasUseDepositFlow: vi.fn(),
  getChristmasDepositAmount: vi.fn(),
};
vi.mock("@/lib/feature-flags", () => flags);

vi.mock("@/lib/customer-auth", () => ({
  getCustomerSession: vi.fn().mockResolvedValue(null),
}));

const repricedResult = {
  lineItems: [
    { wooProductId: 1, productName: "Test Fish", quantity: 1, weight: 0, preparation: "Filleted", unitPrice: 42, lineTotal: 42 },
  ],
  subtotal: 42,
  deliveryFee: 0,
  total: 42,
  isChristmas: true,
};
const reprice = { repriceCheckoutRequest: vi.fn().mockResolvedValue(repricedResult) };
vi.mock("@/lib/checkout/reprice", () => reprice);

const orderResult = { id: 1, number: "1001", status: "processing", total: "42.00", date_created: new Date().toISOString(), billing: { first_name: "Jo", last_name: "Bloggs", email: "jo@example.test" }, line_items: [], meta_data: [] };
const createFromPayment = { createOrderFromPayment: vi.fn().mockResolvedValue({ order: orderResult, repriced: repricedResult }) };
vi.mock("@/lib/checkout/create-order-from-payment", () => createFromPayment);

const preOrderResult = { id: 2, number: "1002", status: "pending", total: "42.00", date_created: new Date().toISOString(), billing: { first_name: "Jo", last_name: "Bloggs", email: "jo@example.test" }, line_items: [], meta_data: [] };
const createFromVerification = { createPreOrderFromVerification: vi.fn().mockResolvedValue({ order: preOrderResult, repriced: repricedResult }) };
vi.mock("@/lib/checkout/create-preorder-from-verification", () => createFromVerification);

const cardstream = {
  authoriseSale: vi.fn(),
  captureSale: vi.fn(),
  verifyCard: vi.fn(),
};
vi.mock("@/lib/cardstream/client", () => ({ getCardstreamClient: () => cardstream }));

const email = { sendOrderConfirmation: vi.fn(), sendAdminNewOrderNotification: vi.fn() };
vi.mock("@/lib/email/send-order-confirmation", () => email);

function christmasBody(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ wooProductId: 1, quantity: 1, weight: 0, preparation: "Filleted", productName: "Test Fish" }],
    fulfilment: { type: "collection", slot: { date: new Date().toISOString(), label: "Test", isChristmas: true } },
    customer: { email: "jo@example.test", firstName: "Jo", lastName: "Bloggs", phone: "07000000000" },
    payment: { token: "tok" },
    ...overrides,
  };
}

function normalBody() {
  return {
    items: [{ wooProductId: 1, quantity: 1, weight: 0, preparation: "Filleted", productName: "Test Fish" }],
    fulfilment: { type: "collection", slot: { date: new Date().toISOString(), label: "Test", isChristmas: false } },
    customer: { email: "jo@example.test", firstName: "Jo", lastName: "Bloggs", phone: "07000000000" },
    payment: { token: "tok" },
  };
}
describe("POST /api/checkout", () => {
  it("charges a Christmas order in full upfront when the deposit flow is off (default)", async () => {
    flags.getChristmasUseDepositFlow.mockResolvedValue(false);
    cardstream.authoriseSale.mockResolvedValue({ status: "authorised", transactionId: "txn_full" });
    cardstream.captureSale.mockResolvedValue({ status: "captured", transactionId: "txn_full" });

    const { POST } = await import("./route");
    const res = await POST(new Request("https://example.test/api/checkout", {
      method: "POST",
      body: JSON.stringify(christmasBody()),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: "authorised", paidInFull: true, orderNumber: "1001" });
    expect(cardstream.authoriseSale).toHaveBeenCalledWith(expect.objectContaining({ amount: 42 }));
    expect(cardstream.captureSale).toHaveBeenCalledWith(expect.objectContaining({ transactionId: "txn_full" }));
    expect(createFromPayment.createOrderFromPayment).toHaveBeenCalledWith(expect.anything(), "txn_full", expect.any(String), null, { paid: true });
    expect(email.sendOrderConfirmation).toHaveBeenCalledWith(expect.objectContaining({ paidInFull: true }));
    expect(createFromVerification.createPreOrderFromVerification).not.toHaveBeenCalled();
  });

  it("handles 3DS on a full-upfront Christmas order", async () => {
    flags.getChristmasUseDepositFlow.mockResolvedValue(false);
    cardstream.authoriseSale.mockResolvedValue({ status: "requires_action", transactionId: "txn_3ds", challenge: { mock: true } });

    const { POST } = await import("./route");
    const res = await POST(new Request("https://example.test/api/checkout", {
      method: "POST",
      body: JSON.stringify(christmasBody()),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: "requires_action", transactionId: "txn_3ds" });
    expect(cardstream.captureSale).not.toHaveBeenCalled();
    expect(createFromPayment.createOrderFromPayment).not.toHaveBeenCalled();
  });

  it("uses the legacy deposit flow when christmasUseDepositFlow is on", async () => {
    flags.getChristmasUseDepositFlow.mockResolvedValue(true);
    flags.getChristmasDepositAmount.mockResolvedValue(60);
    repricedResult.total = 100;
    repricedResult.subtotal = 100;
    cardstream.authoriseSale.mockResolvedValue({ status: "authorised", transactionId: "txn_dep" });
    cardstream.captureSale.mockResolvedValue({ status: "captured", transactionId: "txn_dep" });
    cardstream.verifyCard.mockResolvedValue({ status: "verified", cardToken: "mt_1" });

    const { POST } = await import("./route");
    const res = await POST(new Request("https://example.test/api/checkout", {
      method: "POST",
      body: JSON.stringify(christmasBody()),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: "authorised", depositAmount: 60 });
    expect(cardstream.authoriseSale).toHaveBeenCalledWith(expect.objectContaining({ amount: 60 }));
    expect(cardstream.verifyCard).toHaveBeenCalled();
    expect(createFromVerification.createPreOrderFromVerification).toHaveBeenCalledWith(
      expect.anything(), "mt_1", expect.any(String), null, { amount: 60, transactionId: "txn_dep" }
    );
    expect(createFromPayment.createOrderFromPayment).not.toHaveBeenCalled();
    expect(email.sendOrderConfirmation).toHaveBeenCalledWith(expect.objectContaining({ depositAmount: 60 }));
  });

  it("leaves normal (non-Christmas) orders unchanged", async () => {
    cardstream.authoriseSale.mockResolvedValue({ status: "authorised", transactionId: "txn_normal" });

    const { POST } = await import("./route");
    const res = await POST(new Request("https://example.test/api/checkout", {
      method: "POST",
      body: JSON.stringify(normalBody()),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: "authorised", orderNumber: "1001" });
    expect(json.paidInFull).toBeUndefined();
    expect(json.depositAmount).toBeUndefined();
    expect(cardstream.captureSale).not.toHaveBeenCalled();
    expect(createFromPayment.createOrderFromPayment).toHaveBeenCalledWith(expect.anything(), "txn_normal", expect.any(String), null);
  });
});