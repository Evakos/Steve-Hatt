export interface AuthoriseSaleInput {
  /** Opaque token from Cardstream/Pay360's Hosted Payment Fields - our server never sees raw card data. */
  token: string;
  /** Decimal amount, e.g. 42.50 for £42.50. This is the *estimated* total at checkout time -
   * fish is priced by weight, so the exact final amount isn't known until the order is
   * prepared. This only places a hold; funds move on captureSale. */
  amount: number;
  currency: "GBP";
  orderRef: string;
  customerEmail: string;
}

export type AuthoriseSaleResult =
  | { status: "authorised"; transactionId: string }
  | { status: "requires_action"; transactionId: string; challenge: unknown }
  | { status: "declined"; reason: string };

/**
 * Single-step payment: authorise and settle in one request (Pay360's default behaviour when the
 * `deferred` flag is omitted, docs.pay360.com/cards/authorisations). Used to charge every order in
 * full at checkout - no hold, no 7-day expiry, nothing to capture afterwards.
 */
export interface DirectCardDetails {
  name: string;
  /** Digits only. */
  number: string;
  /** MM/YY */
  expiry: string;
  cvc: string;
}

export type ChargeSaleInput = AuthoriseSaleInput & {
  /** The card typed on our checkout, passed straight on to Pay360. Never stored, logged or put on an order. */
  card?: DirectCardDetails;
  customerName?: string;
  billingAddress?: { line1: string; city: string; postcode: string };
};

/** What Pay360 sends back when the bank has to confirm the payment (3-D Secure) on its own page. */
export interface Pay360ThreeDSChallenge {
  kind: "pay360-3ds";
  /** 1 sends the shopper to the bank with a PaReq; 2 sends them with Pay360's server transaction id. */
  version: number;
  url: string;
  pareq?: string;
  threeDSServerTransId?: string;
}

export function isPay360Challenge(value: unknown): value is Pay360ThreeDSChallenge {
  return typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === "pay360-3ds";
}

export interface ResumeThreeDSInput {
  transactionId: string;
  /** Version 1 only: the bank's answer, posted back to us by the shopper's browser. */
  paRes?: string;
}

export type ResumeThreeDSResult = { status: "paid"; transactionId: string } | { status: "failed"; reason: string };

export type ChargeSaleResult =
  | { status: "paid"; transactionId: string }
  /** 3DS challenge needed. Once the shopper completes it and confirmThreeDS succeeds, the payment
   * is treated as settled (assumed: Pay360's docs don't spell out 3DS on a non-deferred payment). */
  | { status: "requires_action"; transactionId: string; challenge: unknown }
  | { status: "declined"; reason: string };

export interface ConfirmThreeDSInput {
  transactionId: string;
  threeDSResponse: unknown;
}

export type ConfirmThreeDSResult =
  | { status: "authorised"; transactionId: string }
  | { status: "declined"; reason: string };

export interface VerifyCardInput {
  /** Same kind of opaque Hosted Payment Fields token as AuthoriseSaleInput.token - our server
   * never sees raw card data. */
  token: string;
  orderRef: string;
  customerEmail: string;
}

/**
 * Account Verification (docs.pay360.com/cards/account-verification) - validates the card and
 * registers it for reuse *without* placing any hold or starting the 7-day authorisation clock.
 * Used instead of authoriseSale for Christmas pre-orders, where the gap between checkout (as
 * early as 1st November) and capture (23rd/24th December) is far longer than an authorisation
 * would survive. cardToken is the reusable "merchant token" Pay360 returns when payment
 * credentials are stored (docs.pay360.com/cardlock) - see authoriseSaleWithToken, which spends
 * it later, close to the delivery date. Deliberately has no requires_action/3DS variant: whether
 * Account Verification triggers 3DS the same way a payment does isn't confirmed by the public
 * docs, so this doesn't guess at that shape (see real-client.ts).
 */
export type VerifyCardResult = { status: "verified"; cardToken: string } | { status: "declined"; reason: string };

export interface AuthoriseSaleWithTokenInput {
  /** The merchant token from a prior verifyCard call - not a fresh Hosted Payment Fields token. */
  cardToken: string;
  amount: number;
  currency: "GBP";
  orderRef: string;
}

/**
 * Authorises using a previously-stored merchant token, with no card details, CVV, or 3DS request
 * present - Pay360 classifies this as merchant-initiated (MIT) rather than customer-initiated
 * (docs.pay360.com/stored-credentials-framework), and "for merchant initiated (MIT), 3D Secure
 * will never be performed." That's what makes this usable from an unattended scheduled job: there's
 * no customer around to complete a challenge. No requires_action variant, for the same reason.
 */
export type AuthoriseSaleWithTokenResult =
  | { status: "authorised"; transactionId: string }
  | { status: "declined"; reason: string };

export interface CaptureSaleInput {
  transactionId: string;
  /** Pay360's Capture endpoint takes no amount - it always captures the full amount of the
   * original authorisation (confirmed against docs.pay360.com/cards/captures: "Only the full
   * amount of the original authorisation can be captured"). Since fish is priced by weight, the
   * final weighed price is usually less than the hold; the difference is refunded separately via
   * refundSale rather than captured as a smaller amount. */
  orderRef: string;
}

export type CaptureSaleResult =
  | { status: "captured"; transactionId: string }
  | { status: "failed"; reason: string };

export interface RefundSaleInput {
  transactionId: string;
  /** The amount to hand back - for the weighed-fish flow, this is (authorised amount - final
   * amount), refunded immediately after a full capture. Partial refunds are supported
   * (docs.pay360.com/cards/refund: omit amount for a full refund, specify one for a smaller
   * refund), unlike partial capture. */
  amount: number;
  orderRef: string;
}

export type RefundSaleResult =
  | { status: "refunded"; transactionId: string; amount: number }
  | { status: "failed"; reason: string };

export interface HostedSessionInput {
  orderRef: string;
  /** Decimal amount in pounds, e.g. 42.5. */
  amount: number;
  currency: "GBP";
  customerEmail: string;
  customerName: string;
  /** Shown on the Pay360 record, e.g. "Steve Hatt Fishmongers order 123". */
  description: string;
  /** Where Pay360 sends the customer once they have paid or failed. Always on our own domain. */
  returnUrl: string;
  /** Where Pay360 sends the customer if they cancel on the payment page. */
  cancelUrl: string;
}

export type HostedSessionResult =
  | { status: "created"; sessionId: string; redirectUrl: string }
  | { status: "failed"; reason: string };

export interface HostedOutcomeInput {
  sessionId: string;
  orderRef: string;
  /** The query string Pay360 (or the mock page) put on the return URL. Untrusted: only the mock reads it. */
  returnParams: Record<string, string>;
}

export type HostedOutcome =
  | { status: "paid"; transactionId: string; amount: number }
  | { status: "pending" }
  | { status: "failed"; reason: string };

export interface CardstreamClient {
  chargeSale(input: ChargeSaleInput): Promise<ChargeSaleResult>;
  authoriseSale(input: AuthoriseSaleInput): Promise<AuthoriseSaleResult>;
  confirmThreeDS(input: ConfirmThreeDSInput): Promise<ConfirmThreeDSResult>;
  /** Finishes a card payment after the shopper has been to their bank (see Pay360ThreeDSChallenge). */
  resumeThreeDS(input: ResumeThreeDSInput): Promise<ResumeThreeDSResult>;
  captureSale(input: CaptureSaleInput): Promise<CaptureSaleResult>;
  refundSale(input: RefundSaleInput): Promise<RefundSaleResult>;
  verifyCard(input: VerifyCardInput): Promise<VerifyCardResult>;
  authoriseSaleWithToken(input: AuthoriseSaleWithTokenInput): Promise<AuthoriseSaleWithTokenResult>;
  /**
   * Starts a payment on Pay360's own page, which the checkout shows in a frame. The card number is
   * typed into that frame and never reaches us. Returns the address to load in the frame.
   */
  createHostedSession(input: HostedSessionInput): Promise<HostedSessionResult>;
  /** Asks Pay360, server to server, whether a hosted payment went through. Never trust the return URL alone. */
  getHostedOutcome(input: HostedOutcomeInput): Promise<HostedOutcome>;
  /** Verifies an inbound webhook's signature over the exact raw request bytes. Must run before trusting any webhook payload. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}
