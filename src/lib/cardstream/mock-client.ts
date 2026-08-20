import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import type {
  AuthoriseSaleInput,
  CaptureSaleInput,
  ConfirmThreeDSInput,
  RefundSaleInput,
  VerifyCardInput,
  AuthoriseSaleWithTokenInput,
  CardstreamClient,
} from "./types";

/**
 * Dev/test double for the real Cardstream/Pay360 client - lets the checkout Route Handlers
 * (validation, server-side repricing, WooCommerce order creation, webhook flow) be built and
 * tested end-to-end before real Hosted Payment Fields API docs are available. Enabled via
 * CARDSTREAM_MOCK=true. See src/lib/cardstream/client.ts.
 *
 * authoriseSale only places a hold - no capture happens until captureSale is called, once staff
 * confirm the final weighed amount. captureSale always takes the full authorised amount (that's
 * all Pay360's real Capture endpoint accepts); refundSale hands back the difference. The mock
 * doesn't track authorised amounts anywhere, so both always succeed here - the real client will
 * need to actually enforce against Pay360's own records (e.g. refunding more than was captured).
 *
 * verifyCard/authoriseSaleWithToken are the Christmas pre-order path: verifyCard registers the
 * card without holding funds (checkout time, weeks before capture), authoriseSaleWithToken
 * spends the resulting token for the real hold a few days before the delivery slot (see
 * src/app/api/cron/reauthorise-preorders/route.ts). Test tokens: "tok_decline" on verifyCard,
 * "mock_mt_decline" on authoriseSaleWithToken.
 */
export const mockCardstreamClient: CardstreamClient = {
  async authoriseSale(input: AuthoriseSaleInput) {
    if (input.token === "tok_decline") {
      return { status: "declined", reason: "Card declined (mock)" };
    }
    if (input.token === "tok_3ds") {
      return { status: "requires_action", transactionId: `mock_${Date.now()}`, challenge: { mock: true } };
    }
    return { status: "authorised", transactionId: `mock_${Date.now()}` };
  },

  async confirmThreeDS(input: ConfirmThreeDSInput) {
    void input; // mock always approves regardless of the 3DS response
    return { status: "authorised", transactionId: `mock_${Date.now()}` };
  },

  async captureSale(input: CaptureSaleInput) {
    return { status: "captured", transactionId: input.transactionId };
  },

  async refundSale(input: RefundSaleInput) {
    return { status: "refunded", transactionId: input.transactionId, amount: input.amount };
  },

  async verifyCard(input: VerifyCardInput) {
    if (input.token === "tok_decline") {
      return { status: "declined", reason: "Card declined (mock)" };
    }
    return { status: "verified", cardToken: `mock_mt_${Date.now()}` };
  },

  async authoriseSaleWithToken(input: AuthoriseSaleWithTokenInput) {
    if (input.cardToken === "mock_mt_decline") {
      return { status: "declined", reason: "Card declined on scheduled re-authorisation (mock)" };
    }
    return { status: "authorised", transactionId: `mock_${Date.now()}` };
  },

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null) {
    if (!signatureHeader) return false;
    const expected = createHmac("sha256", getServerEnv().CARDSTREAM_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signatureHeader);
    return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
  },
};
