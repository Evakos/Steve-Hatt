import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";

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
  vi.unstubAllGlobals();
});

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function preOrder(id: number, meta: Record<string, string>) {
  return {
    id,
    number: String(id),
    status: "pending",
    total: "42.00",
    date_created: new Date().toISOString(),
    billing: { first_name: "Jo", last_name: "Bloggs", email: `jo${id}@example.test` },
    line_items: [],
    meta_data: Object.entries(meta).map(([key, value]) => ({ key, value })),
  };
}

describe("GET /api/cron/reauthorise-preorders", () => {
  it("rejects requests without the correct bearer secret", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("https://example.test/api/cron/reauthorise-preorders"));
    expect(res.status).toBe(401);
  });

  it("re-authorises orders inside the lead window, leaves distant ones alone, and flags declines", async () => {
    const orders = [
      // Within the 5-day lead window and a token the mock client accepts — should re-authorise.
      preOrder(1, {
        _checkout_is_christmas: "true",
        _cardstream_card_token: "mock_mt_ready",
        _cardstream_estimated_amount: "50.00",
        _checkout_slot_date: daysFromNow(3),
        _checkout_order_ref: "ref-1",
      }),
      // Slot is 10 days out — too early, should be left untouched.
      preOrder(2, {
        _checkout_is_christmas: "true",
        _cardstream_card_token: "mock_mt_toosoon",
        _cardstream_estimated_amount: "30.00",
        _checkout_slot_date: daysFromNow(10),
        _checkout_order_ref: "ref-2",
      }),
      // Within the window but the mock client's decline token — should be flagged, not authorised.
      preOrder(3, {
        _checkout_is_christmas: "true",
        _cardstream_card_token: "mock_mt_decline",
        _cardstream_estimated_amount: "20.00",
        _checkout_slot_date: daysFromNow(1),
        _checkout_order_ref: "ref-3",
      }),
    ];

    const putBodies: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (method === "GET") {
          return new Response(JSON.stringify(orders), { status: 200 });
        }
        if (method === "PUT") {
          putBodies.push({ url: url.toString(), body: JSON.parse(init!.body as string) });
          return new Response(JSON.stringify({ id: 1 }), { status: 200 });
        }
        return new Response("{}", { status: 200 });
      })
    );

    const { GET } = await import("./route");
    const res = await GET(
      new Request("https://example.test/api/cron/reauthorise-preorders", {
        headers: { authorization: "Bearer test-cron-secret" },
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ total: 3, reauthorised: 1, tooEarly: 1, failed: 1 });

    const order1Put = putBodies.find((p) => p.url.includes("/orders/1"));
    expect(order1Put?.body.status).toBe("on-hold");
    expect(order1Put?.body.meta_data).toContainEqual({ key: "_cardstream_authorised_amount", value: "50.00" });

    expect(putBodies.some((p) => p.url.includes("/orders/2"))).toBe(false);

    const order3Put = putBodies.find((p) => p.url.includes("/orders/3"));
    expect(order3Put?.body.status).toBeUndefined();
    expect(order3Put?.body.meta_data).toContainEqual({ key: "_cardstream_preauth_status", value: "auth_failed" });
  });
});
