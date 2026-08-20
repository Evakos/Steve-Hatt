import { NextResponse } from "next/server";
import { getCardstreamClient } from "@/lib/cardstream/client";
import { findOrderByTransactionId } from "@/lib/woocommerce/orders";

// Signature verification uses node:crypto (see src/lib/cardstream/real-client.ts) - not available
// on the Edge runtime, so this must run on Node.
export const runtime = "nodejs";

/**
 * Async fallback for Pay360 payment/3DS notifications, for cases where the shopper's browser
 * never returns from a redirect/challenge. This is the direct fix for the old WordPress plugin's
 * webhook, which trusted unsigned POST data outright (see master plan Context).
 *
 * Reconciliation here is best-effort only: this project has no database, so if the client's
 * /api/checkout/confirm path hasn't already created the order, this handler can verify the
 * payment happened but can't safely fabricate a WooCommerce order without the original
 * cart/customer data. It logs that case for manual reconciliation rather than guessing.
 */
export async function POST(request: Request) {
  // Read raw bytes before any parsing - signature verification must run over the exact
  // payload received, not a reserialized version of it.
  const rawBody = await request.text();
  const signature = request.headers.get("x-cardstream-signature");

  const cardstream = getCardstreamClient();
  if (!cardstream.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const transactionId =
    typeof payload === "object" && payload !== null && "transactionId" in payload
      ? String((payload as { transactionId: unknown }).transactionId)
      : undefined;

  if (!transactionId) {
    return NextResponse.json({ error: "missing transactionId" }, { status: 400 });
  }

  const existingOrder = await findOrderByTransactionId(transactionId);
  if (!existingOrder) {
    console.error(
      `[pay360 webhook] payment notification for transaction ${transactionId} has no matching WooCommerce ` +
        "order yet - the client-side confirm step may not have completed. Needs manual reconciliation."
    );
  }

  return NextResponse.json({ received: true });
}
