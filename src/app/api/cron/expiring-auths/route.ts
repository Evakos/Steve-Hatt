import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { listPendingCaptureOrders } from "@/lib/woocommerce/orders";
import { sendExpiringAuthAlert } from "@/lib/email/send-order-confirmation";

// Pay360 holds expire 7 days after creation. Start flagging once a hold is this many days old.
// Mirrors AUTH_WARNING_DAYS in src/app/admin/(dashboard)/orders/capture-order-card.tsx.
const AUTH_WARNING_DAYS = 5;

/**
 * Runs daily via Vercel Cron (see vercel.json) to email the team about on-hold orders whose hold is
 * closing in on its 7-day expiry, before it lapses and capture fails. A nudge only: on-hold orders
 * don't retain a card token (only Christmas pre-orders do), so there's nothing to automatically
 * re-authorise - the team needs to capture promptly. Idempotent: it never changes any order, just
 * emails.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${getServerEnv().CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await listPendingCaptureOrders();

  const expiring = pending
    .map((order) => ({
      number: order.number,
      customerName: `${order.billing.first_name} ${order.billing.last_name}`.trim(),
      total: order.total,
      daysSinceAuth: Math.floor((Date.now() - new Date(order.date_created).getTime()) / 86_400_000),
    }))
    .filter((o) => o.daysSinceAuth >= AUTH_WARNING_DAYS);

  if (expiring.length > 0) {
    await sendExpiringAuthAlert({ orders: expiring });
  }

  return NextResponse.json({ status: "done", total: pending.length, expiring: expiring.length });
}