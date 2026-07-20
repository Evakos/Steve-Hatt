import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";

const WEBHOOK_SECRET = "test-secret";

// env.ts validates and caches on first access, and CARDSTREAM_MOCK selects the mock client
// (which uses the same real HMAC-SHA256 signature logic as the real client) — see
// src/lib/cardstream/mock-client.ts. These must be set before the route module is imported.
beforeAll(() => {
  process.env.WOOCOMMERCE_URL = "https://example.test";
  process.env.WOOCOMMERCE_CONSUMER_KEY = "ck_test";
  process.env.WOOCOMMERCE_CONSUMER_SECRET = "cs_test";
  process.env.CARDSTREAM_API_BASE_URL = "https://api.mite.pay360.com";
  process.env.CARDSTREAM_API_USERNAME = "user";
  process.env.CARDSTREAM_API_PASSWORD = "pass";
  process.env.CARDSTREAM_INSTALLATION_ID = "inst";
  process.env.CARDSTREAM_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.CARDSTREAM_MOCK = "true";
  process.env.RESEND_API_KEY = "re_test";
  process.env.ADMIN_NOTIFICATION_EMAIL = "admin@example.test";
  process.env.STAFF_PASSWORD = "test-staff-password";
  process.env.STAFF_SESSION_SECRET = "test-staff-session-secret";
  process.env.CUSTOMER_SESSION_SECRET = "test-customer-session-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function sign(body: string) {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

describe("POST /api/webhooks/pay360", () => {
  it("rejects a request with no signature header", async () => {
    const { POST } = await import("./route");
    const body = JSON.stringify({ transactionId: "abc123" });
    const res = await POST(new Request("https://example.test/api/webhooks/pay360", { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("rejects a tampered body whose signature no longer matches", async () => {
    const { POST } = await import("./route");
    const originalBody = JSON.stringify({ transactionId: "abc123" });
    const signature = sign(originalBody);
    const tamperedBody = JSON.stringify({ transactionId: "attacker-controlled" });
    const res = await POST(
      new Request("https://example.test/api/webhooks/pay360", {
        method: "POST",
        body: tamperedBody,
        headers: { "x-cardstream-signature": signature },
      })
    );
    expect(res.status).toBe(401);
  });

  it("accepts a validly-signed request and reports success even when no matching order exists yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
    );
    const { POST } = await import("./route");
    const body = JSON.stringify({ transactionId: "abc123" });
    const res = await POST(
      new Request("https://example.test/api/webhooks/pay360", {
        method: "POST",
        body,
        headers: { "x-cardstream-signature": sign(body) },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it("is idempotent: a duplicate notification for an already-reconciled order still returns 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify([{ id: 99, number: "99", status: "processing", total: "42.00" }]), { status: 200 })
      )
    );
    const { POST } = await import("./route");
    const body = JSON.stringify({ transactionId: "abc123" });
    const res = await POST(
      new Request("https://example.test/api/webhooks/pay360", {
        method: "POST",
        body,
        headers: { "x-cardstream-signature": sign(body) },
      })
    );
    expect(res.status).toBe(200);
  });
});
