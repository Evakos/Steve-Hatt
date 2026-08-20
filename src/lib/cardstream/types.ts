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

export interface CardstreamClient {
  authoriseSale(input: AuthoriseSaleInput): Promise<AuthoriseSaleResult>;
  confirmThreeDS(input: ConfirmThreeDSInput): Promise<ConfirmThreeDSResult>;
  captureSale(input: CaptureSaleInput): Promise<CaptureSaleResult>;
  refundSale(input: RefundSaleInput): Promise<RefundSaleResult>;
  verifyCard(input: VerifyCardInput): Promise<VerifyCardResult>;
  authoriseSaleWithToken(input: AuthoriseSaleWithTokenInput): Promise<AuthoriseSaleWithTokenResult>;
  /** Verifies an inbound webhook's signature over the exact raw request bytes. Must run before trusting any webhook payload. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}
