import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { getPaymentConfig, type PaymentConfig } from "./config";
import type {
  CardstreamClient,
  ChargeSaleInput,
  AuthoriseSaleInput,
  CaptureSaleInput,
  ConfirmThreeDSInput,
  RefundSaleInput,
  VerifyCardInput,
  AuthoriseSaleWithTokenInput,
  HostedOutcomeInput,
  HostedSessionInput,
  ResumeThreeDSInput,
} from "./types";

/**
 * Real Cardstream/Pay360 Hosted Payment Fields integration.
 *
 * authoriseSale/confirmThreeDS/captureSale/refundSale/verifyCard/authoriseSaleWithToken are
 * intentionally unimplemented: the token-based Direct Integration endpoint, request/response
 * shape, and 3-D Secure 2 challenge contract for Hosted Payment Fields sit behind Pay360's
 * merchant developer portal (see the master plan, Phase D) and weren't accessible during this
 * build. Failing loudly here - rather than guessing a shape - avoids shipping a payment
 * integration built on assumptions.
 *
 * The capture/refund *business logic* is confirmed against docs.pay360.com (public, no portal
 * access needed): Capture always takes the full authorised amount - "Only the full amount of
 * the original authorisation can be captured" - so there is no partial capture. Since fish is
 * priced by weight and the final amount is usually less than the hold, the flow is: capture in
 * full, then Refund the difference (partial refunds ARE supported). Authorisations expire 7
 * days after creation, after which Capture/Cancel both fail.
 *
 * The verifyCard/authoriseSaleWithToken split (Christmas pre-orders - see
 * src/lib/checkout/create-preorder-from-verification.ts and
 * src/app/api/cron/reauthorise-preorders/route.ts) is likewise confirmed at the business-logic
 * level: Account Verification returns a reusable merchant token without holding funds
 * (docs.pay360.com/cards/account-verification, docs.pay360.com/cardlock), and spending that
 * token later with no card/CVV/3DS present is classified merchant-initiated - "for merchant
 * initiated (MIT), 3D Secure will never be performed" (docs.pay360.com/stored-credentials-framework)
 * - which is what makes an unattended scheduled re-authorisation possible at all. What's still
 * unconfirmed is the exact Hosted Payment Fields *token* shape/endpoint for either flow, since
 * the public docs mostly cover the server-to-server Cards API - confirm the tokenised flow
 * specifically once Explorer/portal access is set up. Also unconfirmed: whether Account
 * Verification can trigger a 3DS challenge the way a payment can - VerifyCardResult deliberately
 * has no requires_action variant rather than guessing, so this may need revisiting.
 *
 * verifyWebhookSignature below still assumes a generic HMAC-SHA256-over-raw-body scheme with a
 * `x-cardstream-signature` header. That assumption is now known to be WRONG, not just unconfirmed:
 * Pay360's Notifications docs describe no signature header at all - they authenticate inbound
 * notifications by source IP instead (185.161.164.0/22). Left as-is for now (out of scope for the
 * capture/refund fix); replace with an IP-range check before this goes live against real webhooks.
 */
interface Pay360Response {
  transaction?: { transactionId?: string; status?: string };
  outcome?: { reasonCode?: string; reasonMessage?: string };
  threeDSecure?: { version?: number | string; status?: string };
  clientRedirect?: { url?: string; pareq?: string; threeDSServerTransId?: string };
}

const DECLINED_MESSAGE = "Your card was declined. Please check the details or try another card.";

/** One call to Pay360's direct card API, the same one the old WordPress plugin uses. */
async function postToPay360(config: PaymentConfig, path: string, body: unknown): Promise<Pay360Response> {
  const res = await fetch(`${config.baseUrl}/acceptor/rest/transactions/${config.installationId}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as Pay360Response | null;
  // Only the outcome codes are ever logged, never the request: it holds the card number.
  if (!res.ok || !json) console.error(`[pay360] ${path.split("/").pop()} answered ${res.status}`, json?.outcome ?? "");
  return json ?? {};
}

/**
 * Real Pay360 client. chargeSale and resumeThreeDS use Pay360's direct card API (the card typed on
 * our checkout is passed straight on, never stored or logged), copied from the old WordPress
 * plugin, which works on this live installation. The rest below is still unimplemented.
 */
export const realCardstreamClient: CardstreamClient = {
  async chargeSale(input: ChargeSaleInput) {
    const card = input.card;
    if (!card) return { status: "declined", reason: "Your card details didn't arrive. Please try again." };

    const config = await getPaymentConfig();
    const json = await postToPay360(config, "payment", {
      transaction: {
        currency: input.currency,
        amount: input.amount.toFixed(2),
        merchantRef: input.orderRef.replace(/-/g, ""),
        commerceType: "ECOM",
      },
      paymentMethod: {
        card: { pan: card.number, expiryDate: card.expiry.replace("/", ""), cv2: card.cvc, cardHolderName: card.name },
        ...(input.billingAddress ? { billingAddress: { ...input.billingAddress, countryCode: "GB" } } : {}),
      },
      customer: { registered: false, displayName: input.customerName ?? "", email: input.customerEmail },
    });

    const transactionId = json.transaction?.transactionId;
    if (transactionId && json.clientRedirect?.url) {
      return {
        status: "requires_action",
        transactionId,
        challenge: {
          kind: "pay360-3ds",
          version: Number(json.threeDSecure?.version),
          url: json.clientRedirect.url,
          pareq: json.clientRedirect.pareq,
          threeDSServerTransId: json.clientRedirect.threeDSServerTransId,
        },
      };
    }
    if (transactionId && json.transaction?.status === "SUCCESS") return { status: "paid", transactionId };
    return { status: "declined", reason: DECLINED_MESSAGE };
  },

  async resumeThreeDS(input: ResumeThreeDSInput) {
    const config = await getPaymentConfig();
    const json = await postToPay360(
      config,
      `${input.transactionId}/resume`,
      input.paRes ? { threeDSecureResponse: { pares: input.paRes } } : {}
    );
    const transactionStatus = json.transaction?.status;
    if (json.threeDSecure?.status === "AUTHENTICATED" && (!transactionStatus || transactionStatus === "SUCCESS")) {
      return { status: "paid", transactionId: input.transactionId };
    }
    return { status: "failed", reason: "Your bank couldn't confirm the payment, so you haven't been charged." };
  },

  async authoriseSale(input: AuthoriseSaleInput) {
    void input;
    throw new Error(
      "Cardstream Hosted Payment Fields integration not implemented - requires Pay360 developer portal " +
        "access (endpoint, request/response shape, 3DS2 contract). See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async confirmThreeDS(input: ConfirmThreeDSInput) {
    void input;
    throw new Error(
      "Cardstream 3-D Secure confirmation not implemented - requires Pay360 developer portal access. " +
        "See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async captureSale(input: CaptureSaleInput) {
    void input;
    throw new Error(
      "Cardstream capture not implemented - requires Pay360 developer portal access for the Hosted Payment " +
        "Fields token flow (capture always takes the full authorised amount, confirmed via docs.pay360.com). " +
        "See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async refundSale(input: RefundSaleInput) {
    void input;
    throw new Error(
      "Cardstream refund not implemented - requires Pay360 developer portal access for the Hosted Payment " +
        "Fields token flow (partial refunds are supported, confirmed via docs.pay360.com). " +
        "See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async verifyCard(input: VerifyCardInput) {
    void input;
    throw new Error(
      "Cardstream account verification not implemented - requires Pay360 developer portal access for the " +
        "Hosted Payment Fields token flow (verification-without-holding-funds is confirmed at the business-logic " +
        "level via docs.pay360.com/cards/account-verification). See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async authoriseSaleWithToken(input: AuthoriseSaleWithTokenInput) {
    void input;
    throw new Error(
      "Cardstream merchant-token re-authorisation not implemented - requires Pay360 developer portal access " +
        "(merchant-initiated classification confirmed via docs.pay360.com/stored-credentials-framework). " +
        "See plan Phase D. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async createHostedSession(input: HostedSessionInput) {
    void input;
    throw new Error(
      "Pay360 hosted payment page not implemented yet. It is POST {host}/hosted/rest/sessions/{installationId}/payments " +
        "(with session.returnUrl and session.cancelUrl; Pay360 replies with a sessionId and a redirectUrl), but the " +
        "request body isn't confirmed: get Pay360's PaySuite Payment Page 'Take a payment' doc or test against the " +
        "MITE sandbox before writing it. Use getPaymentConfig() for the host and login. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  async getHostedOutcome(input: HostedOutcomeInput) {
    void input;
    throw new Error(
      "Pay360 hosted payment lookup not implemented yet: needs the 'Retrieve a transaction' / session status call " +
        "confirmed against Pay360's docs or the MITE sandbox. Set CARDSTREAM_MOCK=true for dev."
    );
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null) {
    if (!signatureHeader) return false;
    const expected = createHmac("sha256", getServerEnv().CARDSTREAM_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signatureHeader);
    return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
  },
};
