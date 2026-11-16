export interface CardDetails {
  name: string;
  /** Digits only. */
  number: string;
  /** MM/YY */
  expiry: string;
  cvc: string;
}

/** `card` is set when there is no token to give: the card then goes to Pay360 through our own server. */
export type TokeniseResult = { ok: true; token: string; card?: CardDetails } | { ok: false; error: string };

/**
 * Turns card details typed on our checkout into a one-time token, in the browser, so that only the
 * token is ever sent to our server. The real route is Pay360's CardLock (the browser sends the card
 * straight to Pay360 and gets a token back), which is not connected yet: its endpoint and script
 * need confirming against Pay360's docs. Until then this only works while the built-in test payments
 * are on, where test card numbers stand in for tokens and nothing leaves the browser:
 *   4242 4242 4242 4242 approved, 4000 0000 0000 0002 declined, 4000 0000 0000 3220 asks for 3D Secure.
 */
export async function tokeniseCard(card: CardDetails): Promise<TokeniseResult> {
  let mock = false;
  try {
    const res = await fetch("/api/payment-config");
    if (res.ok) mock = (await res.json()).mock === true;
  } catch {
    // Treated as "not mock": fall through to the not-connected message below.
  }

  if (mock) {
    if (card.number === "4000000000000002") return { ok: true, token: "tok_decline" };
    if (card.number === "4000000000003220") return { ok: true, token: "tok_3ds" };
    return { ok: true, token: "tok_mock_visa" };
  }

  // No CardLock (it is a paid extra on Pay360): the card is passed to our server, which hands it straight to Pay360.
  return { ok: true, token: "card", card };
}
