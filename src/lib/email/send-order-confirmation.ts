import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import type { RepricedOrder } from "@/lib/checkout/reprice";

const FROM_ADDRESS = "orders@stevehattfishmongers.co.uk";

let cachedClient: Resend | null = null;
function resend() {
  if (!cachedClient) cachedClient = new Resend(getServerEnv().RESEND_API_KEY);
  return cachedClient;
}

export interface OrderConfirmationInput {
  to: string;
  customerName: string;
  orderNumber: string;
  repriced: RepricedOrder;
  slotLabel: string;
  fulfilmentType: "delivery" | "collection";
}

/**
 * Sends the order confirmation. The amount shown here is the *estimated* total (an
 * authorisation hold, not a charge) — fish is priced by weight, so the wording is deliberately
 * "estimated total" / "final amount confirmed once weighed", not "amount charged". Failures are
 * swallowed by the caller (see checkout route) — a lost confirmation email shouldn't fail an
 * otherwise-successful order.
 */
export async function sendOrderConfirmation(input: OrderConfirmationInput) {
  const { to, customerName, orderNumber, repriced, slotLabel, fulfilmentType } = input;

  const lineRows = repriced.lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;">${item.quantity} &times; item</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right;">&pound;${item.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">Order #${orderNumber} received</h1>
      <p>Hi ${customerName}, thanks for your order from Steve Hatt Fishmongers.</p>
      <p style="background:#fff8e6;border:1px solid #f0d878;padding:12px;border-radius:5px;font-size:14px;">
        <strong>You haven't been charged yet.</strong> Since fish is priced by weight,
        we'll confirm the exact final amount once your order is prepared, then take payment for that
        confirmed amount only.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${lineRows}
        <tr><td style="padding:8px 0;">Estimated subtotal</td><td style="padding:8px 0;text-align:right;">&pound;${repriced.subtotal.toFixed(2)}</td></tr>
        ${fulfilmentType === "delivery" ? `<tr><td style="padding:8px 0;">Delivery</td><td style="padding:8px 0;text-align:right;">&pound;${repriced.deliveryFee.toFixed(2)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;font-weight:bold;">Estimated total (not yet charged)</td><td style="padding:8px 0;text-align:right;font-weight:bold;">&pound;${repriced.total.toFixed(2)}</td></tr>
      </table>
      <p><strong>${fulfilmentType === "delivery" ? "Delivery" : "Collection"}:</strong> ${slotLabel}</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Steve Hatt Fishmongers</p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Order #${orderNumber} received — estimated total £${repriced.total.toFixed(2)}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send order confirmation email", err);
  }
}

export interface CaptureConfirmationInput {
  to: string;
  customerName: string;
  orderNumber: string;
  capturedAmount: number;
  authorisedAmount: number;
}

/**
 * Sent once staff confirm the final weighed price and capture payment (see
 * src/app/api/admin/capture/route.ts) — this is the email that actually says money moved,
 * distinct from sendOrderConfirmation's "you haven't been charged yet" wording at checkout time.
 * Same failure handling as sendOrderConfirmation: swallowed here, doesn't fail the capture.
 */
export async function sendCaptureConfirmation(input: CaptureConfirmationInput) {
  const { to, customerName, orderNumber, capturedAmount, authorisedAmount } = input;
  const adjustedDown = capturedAmount < authorisedAmount - 0.001;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">Order #${orderNumber} is now processing</h1>
      <p>Hi ${customerName}, your order has been weighed and prepared, and your card has now been charged the confirmed final amount. We're getting it ready for you.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;">Estimated amount (at checkout)</td><td style="padding:8px 0;text-align:right;">&pound;${authorisedAmount.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;">Final amount charged</td><td style="padding:8px 0;text-align:right;font-weight:bold;">&pound;${capturedAmount.toFixed(2)}</td></tr>
      </table>
      ${
        adjustedDown
          ? `<p style="font-size:13px;color:#6b7280;">The final weighed price came to less than the original estimate, so that's all you've been charged.</p>`
          : ""
      }
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Steve Hatt Fishmongers</p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Order #${orderNumber} is processing — £${capturedAmount.toFixed(2)} charged`,
      html,
    });
  } catch (err) {
    console.error("Failed to send capture confirmation email", err);
  }
}

export interface OrderCompleteInput {
  to: string;
  customerName: string;
  orderNumber: string;
  fulfilmentType: "delivery" | "collection";
}

/**
 * Sent once staff mark the order complete (src/app/api/admin/complete/route.ts) — the third and
 * final stage after "order received" (checkout) and "processing" (capture): on-hold -> processing
 * -> completed, mirroring WooCommerce's own order status names. Same failure handling as the
 * other order emails: swallowed here, doesn't fail the "mark complete" action.
 */
export async function sendOrderCompleteEmail(input: OrderCompleteInput) {
  const { to, customerName, orderNumber, fulfilmentType } = input;
  const verb = fulfilmentType === "delivery" ? "delivered" : "collected";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">Order #${orderNumber} complete</h1>
      <p>Hi ${customerName}, your order has been ${verb}. Thanks for shopping with Steve Hatt Fishmongers — we hope you enjoy it.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Steve Hatt Fishmongers</p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Order #${orderNumber} complete`,
      html,
    });
  } catch (err) {
    console.error("Failed to send order complete email", err);
  }
}

export interface AdminNewOrderNotificationInput {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  repriced: RepricedOrder;
  slotLabel: string;
  fulfilmentType: "delivery" | "collection";
}

/**
 * Notifies staff (ADMIN_NOTIFICATION_EMAIL, currently chris@stevehattfishmongers.co.uk — a real
 * Google Workspace inbox, unaffected by the send.stevehattfishmongers.co.uk Resend DNS setup)
 * that a new order needs preparing. Fires alongside sendOrderConfirmation at checkout time —
 * see /api/checkout and /api/checkout/confirm. Same failure handling: swallowed, doesn't fail
 * the order.
 */
export async function sendAdminNewOrderNotification(input: AdminNewOrderNotificationInput) {
  const { orderNumber, customerName, customerEmail, repriced, slotLabel, fulfilmentType } = input;
  const to = getServerEnv().ADMIN_NOTIFICATION_EMAIL;

  const lineRows = repriced.lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;">${item.quantity} &times; product ${item.wooProductId}${item.preparation ? ` (${item.preparation})` : ""}${item.weight ? ` — ${item.weight}kg est.` : ""}</td>
          <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;text-align:right;">&pound;${item.lineTotal.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">New order #${orderNumber} — needs preparing</h1>
      <p>${customerName} (${customerEmail}) — ${fulfilmentType === "delivery" ? "Delivery" : "Collection"}: ${slotLabel}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        ${lineRows}
        <tr><td style="padding:6px 0;font-weight:bold;">Estimated total (held, not yet charged)</td><td style="padding:6px 0;text-align:right;font-weight:bold;">&pound;${repriced.total.toFixed(2)}</td></tr>
      </table>
      <p style="font-size:13px;">Once weighed and prepared, capture the final price at
        <a href="https://steve-hatt-demo.vercel.app/admin/orders">steve-hatt-demo.vercel.app/admin/orders</a>.
      </p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `New order #${orderNumber} — £${repriced.total.toFixed(2)} est.`,
      html,
    });
  } catch (err) {
    console.error("Failed to send admin new-order notification email", err);
  }
}

export interface PreOrderAuthFailedInput {
  to: string;
  customerName: string;
  orderNumber: string;
}

/**
 * Sent when src/app/api/cron/reauthorise-preorders/route.ts tries to place the real hold on a
 * Christmas pre-order a few days before the delivery slot, and the card is declined (expired,
 * insufficient funds, etc.) — there's no customer present at that point to retry or complete a
 * 3DS challenge (see AuthoriseSaleWithTokenResult), so this is the recovery path. Deliberately
 * doesn't link to a self-service "update your card" page — that doesn't exist yet, this asks the
 * customer to contact the shop directly. Same failure handling as the other order emails.
 */
export async function sendPreOrderAuthFailedEmail(input: PreOrderAuthFailedInput) {
  const { to, customerName, orderNumber } = input;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">We couldn't confirm payment for order #${orderNumber}</h1>
      <p>Hi ${customerName}, we tried to place a hold on your card ahead of preparing your Christmas order,
      but it wasn't accepted. This can happen if a card has expired or changed since you ordered.</p>
      <p style="background:#fff8e6;border:1px solid #f0d878;padding:12px;border-radius:5px;font-size:14px;">
        Please <strong>contact us as soon as possible</strong> so we can take payment another way — your
        order can't be prepared until this is sorted.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">Steve Hatt Fishmongers</p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Action needed: payment for order #${orderNumber}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send pre-order auth-failed email", err);
  }
}

export interface AdminPreOrderAuthFailedInput {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
}

/** Staff-side counterpart to sendPreOrderAuthFailedEmail — flags the order for follow-up, since
 * it won't move into the normal /admin/orders capture queue until payment is resolved. */
export async function sendAdminPreOrderAuthFailedAlert(input: AdminPreOrderAuthFailedInput) {
  const { orderNumber, customerName, customerEmail, reason } = input;
  const to = getServerEnv().ADMIN_NOTIFICATION_EMAIL;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">Pre-order #${orderNumber} needs attention</h1>
      <p>Scheduled re-authorisation failed for ${customerName} (${customerEmail}): ${reason}</p>
      <p style="font-size:13px;">The customer has been asked to get in touch. This order won't appear in the
        normal capture queue until payment is resolved.</p>
    </div>
  `;

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Action needed: pre-order #${orderNumber} payment failed`,
      html,
    });
  } catch (err) {
    console.error("Failed to send admin pre-order auth-failed alert", err);
  }
}
