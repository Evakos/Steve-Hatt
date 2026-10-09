import { describe, it, expect, beforeAll, vi } from "vitest";

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

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

describe("magic link tokens", () => {
  it("round-trips the email on its own", async () => {
    const { createMagicLinkToken, readMagicLinkToken, verifyMagicLinkToken } = await import("./customer-auth");
    const token = createMagicLinkToken("jo@example.test");
    expect(readMagicLinkToken(token)).toEqual({ email: "jo@example.test", postcode: undefined });
    expect(verifyMagicLinkToken(token)).toBe("jo@example.test");
  });

  it("carries a postcode checked on the homepage", async () => {
    const { createMagicLinkToken, readMagicLinkToken } = await import("./customer-auth");
    const token = createMagicLinkToken("jo@example.test", "N1 8LU");
    expect(readMagicLinkToken(token)).toEqual({ email: "jo@example.test", postcode: "N1 8LU" });
  });

  it("rejects a token whose payload has been tampered with", async () => {
    const { createMagicLinkToken, readMagicLinkToken } = await import("./customer-auth");
    const [, expiry, signature] = createMagicLinkToken("jo@example.test", "N1 8LU").split(".");
    const forged = `${Buffer.from("jo@example.test\nSW1A 1AA").toString("base64url")}.${expiry}.${signature}`;
    expect(readMagicLinkToken(forged)).toBeNull();
  });
});

describe("formatFullPostcode", () => {
  it("formats complete postcodes and rejects partial ones", async () => {
    const { formatFullPostcode } = await import("./delivery-zones");
    expect(formatFullPostcode("n18lu")).toBe("N1 8LU");
    expect(formatFullPostcode(" ec1a 1bb ")).toBe("EC1A 1BB");
    expect(formatFullPostcode("N1")).toBeNull();
    expect(formatFullPostcode("hello")).toBeNull();
  });
});
