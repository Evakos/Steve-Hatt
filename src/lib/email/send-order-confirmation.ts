import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import type { RepricedOrder } from "@/lib/checkout/reprice";
import { COLORS, SITE_URL, emailShell, emailHeading, emailNotice, emailAlert, emailButton, emailLineItemsTable } from "./layout";

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
  /** Set when a deposit was captured at checkout (Christmas deposit model) - the confirmation then
   * says "deposit paid now, balance to settle on collection" instead of "you haven't been charged yet". */
  depositAmount?: number;
}

/**
 * Sends the order confirmation. The amount shown here is the *estimated* total (an
 * authorisation hold, not a charge) - fish is priced by weight, so the wording is deliberately
 * "estimated total" / "final amount confirmed once weighed", not "amount charged". Failures are
 * swallowed by the caller (see checkout route) - a lost confirmation email shouldn't fail an
 * otherwise-successful order.
 */
export async function sendOrderConfirmation(input: OrderConfirmationInput) {
  const { to, customerName, orderNumber, repriced, slotLabel, fulfilmentType, depositAmount } = input;
  const deposit = depositAmount ?? 0;
  const hasDeposit = deposit > 0;
  const balance = hasDeposit ? repriced.total - deposit : repriced.total;

  const totalsTable = hasDeposit
    ? `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;">
      <tr><td style="padding:4px 0;color:${COLORS.textLight};">Estimated total</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${repriced.total.toFixed(2)}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">Deposit paid now</td><td style="padding:8px 0 0;text-align:right;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">&pound;${deposit.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:${COLORS.textLight};">Balance to settle on collection (estimated)</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${balance.toFixed(2)}</td></tr>
    </table>
  `
    : `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;">
      <tr><td style="padding:4px 0;color:${COLORS.textLight};">Estimated subtotal</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${repriced.subtotal.toFixed(2)}</td></tr>
      ${fulfilmentType === "delivery" ? `<tr><td style="padding:4px 0;color:${COLORS.textLight};">Delivery</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${repriced.deliveryFee.toFixed(2)}</td></tr>` : ""}
      <tr><td style="padding:8px 0 0;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">Estimated total (not yet charged)</td><td style="padding:8px 0 0;text-align:right;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">&pound;${repriced.total.toFixed(2)}</td></tr>
    </table>
  `;

  const html = emailShell(`
    ${emailHeading(`Order #${orderNumber} received`)}
    <p>Hi ${customerName}, thanks for your order from Steve Hatt Fishmongers.</p>
    ${emailNotice(
      hasDeposit
        ? `<strong>Your £${deposit.toFixed(2)} deposit has been paid.</strong> The remaining balance
        (estimated £${balance.toFixed(2)}) will be confirmed and settled on collection, once your order has
        been weighed and prepared.`
        : `<strong>You haven't been charged yet.</strong> Since fish is priced by weight, we'll confirm the exact
        final amount once your order is prepared, then take payment for that confirmed amount only.`
    )}
    ${emailLineItemsTable(repriced.lineItems)}
    ${totalsTable}
    <p style="margin-top:20px;"><strong>${fulfilmentType === "delivery" ? "Delivery" : "Collection"}:</strong> ${slotLabel}</p>
  `);

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Order #${orderNumber} received, estimated total £${repriced.total.toFixed(2)}`,
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
  /** Set when a deposit was captured at checkout - shown as a separate "deposit already paid" line. */
  depositAmount?: number;
}

/**
 * Sent once staff confirm the final weighed price and capture payment (see
 * src/app/api/admin/capture/route.ts) - this is the email that actually says money moved,
 * distinct from sendOrderConfirmation's "you haven't been charged yet" wording at checkout time.
 * Same failure handling as sendOrderConfirmation: swallowed here, doesn't fail the capture.
 */
export async function sendCaptureConfirmation(input: CaptureConfirmationInput) {
  const { to, customerName, orderNumber, capturedAmount, authorisedAmount, depositAmount } = input;
  const deposit = depositAmount ?? 0;
  const hasDeposit = deposit > 0;
  const adjustedDown = capturedAmount < (hasDeposit ? deposit + authorisedAmount : authorisedAmount) - 0.001;

  const html = emailShell(`
    ${emailHeading(`Order #${orderNumber} is now processing`)}
    <p>Hi ${customerName}, your order has been weighed and prepared, and your card has now been charged the
    confirmed final amount. We're getting it ready for you.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
      ${hasDeposit
        ? `<tr><td style="padding:4px 0;color:${COLORS.textLight};">Deposit (paid at checkout)</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${deposit.toFixed(2)}</td></tr>`
        : `<tr><td style="padding:4px 0;color:${COLORS.textLight};">Estimated amount (at checkout)</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${authorisedAmount.toFixed(2)}</td></tr>`}
      <tr><td style="padding:8px 0 0;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">Final amount charged</td><td style="padding:8px 0 0;text-align:right;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">&pound;${capturedAmount.toFixed(2)}</td></tr>
    </table>
    ${adjustedDown ? `<p style="font-size:13px;color:${COLORS.textLight};">The final weighed price came to less than the original estimate, so that's all you've been charged.</p>` : ""}
  `);

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `Order #${orderNumber} is processing, £${capturedAmount.toFixed(2)} charged`,
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
 * Sent once staff mark the order complete (src/app/api/admin/complete/route.ts) - the third and
 * final stage after "order received" (checkout) and "processing" (capture): on-hold -> processing
 * -> completed, mirroring WooCommerce's own order status names. Same failure handling as the
 * other order emails: swallowed here, doesn't fail the "mark complete" action.
 */
export async function sendOrderCompleteEmail(input: OrderCompleteInput) {
  const { to, customerName, orderNumber, fulfilmentType } = input;
  const verb = fulfilmentType === "delivery" ? "delivered" : "collected";

  const html = emailShell(`
    ${emailHeading(`Order #${orderNumber} complete`)}
    <p>Hi ${customerName}, your order has been ${verb}. Thanks for shopping with Steve Hatt Fishmongers, we hope
    you enjoy it.</p>
  `);

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
  /** Set when a deposit was captured at checkout - flags the order as deposit+balance rather than full-hold. */
  depositAmount?: number;
}

/**
 * Notifies staff (every address in ADMIN_NOTIFICATION_EMAIL - a comma-separated list, see
 * .env.example) that a new order needs preparing. Fires alongside sendOrderConfirmation at
 * checkout time - see /api/checkout and /api/checkout/confirm. Same failure handling: swallowed,
 * doesn't fail the order.
 */
export async function sendAdminNewOrderNotification(input: AdminNewOrderNotificationInput) {
  const { orderNumber, customerName, customerEmail, repriced, slotLabel, fulfilmentType, depositAmount } = input;
  const to = getServerEnv().ADMIN_NOTIFICATION_EMAIL;
  const deposit = depositAmount ?? 0;
  const hasDeposit = deposit > 0;
  const balance = hasDeposit ? repriced.total - deposit : repriced.total;

  const html = emailShell(`
    ${emailHeading(`New order #${orderNumber} - needs preparing`)}
    <p>${customerName} (${customerEmail}) - ${fulfilmentType === "delivery" ? "Delivery" : "Collection"}: ${slotLabel}</p>
    ${emailLineItemsTable(repriced.lineItems)}
    <table style="width:100%;border-collapse:collapse;">
      ${hasDeposit ? `<tr><td style="padding:4px 0;color:${COLORS.textLight};">Deposit captured at checkout</td><td style="padding:4px 0;text-align:right;color:${COLORS.text};">&pound;${deposit.toFixed(2)}</td></tr>` : ""}
      <tr><td style="padding:8px 0 0;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">${hasDeposit ? "Balance to capture on collection (estimate)" : "Estimated total (held, not yet charged)"}</td><td style="padding:8px 0 0;text-align:right;font-weight:700;color:${COLORS.navy};border-top:1px solid ${COLORS.border};">&pound;${(hasDeposit ? balance : repriced.total).toFixed(2)}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:${COLORS.textLight};">Once weighed and prepared, capture the final price on the orders page.</p>
    ${emailButton(`${SITE_URL}/admin/orders`, "Go to admin orders")}
  `);

  try {
    await resend().emails.send({
      from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
      to,
      subject: `New order #${orderNumber} - £${repriced.total.toFixed(2)} est.`,
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
 * insufficient funds, etc.) - there's no customer present at that point to retry or complete a
 * 3DS challenge (see AuthoriseSaleWithTokenResult), so this is the recovery path. Deliberately
 * doesn't link to a self-service "update your card" page - that doesn't exist yet, this asks the
 * customer to contact the shop directly. Same failure handling as the other order emails.
 */
export async function sendPreOrderAuthFailedEmail(input: PreOrderAuthFailedInput) {
  const { to, customerName, orderNumber } = input;

  const html = emailShell(`
    ${emailHeading(`We couldn't confirm payment for order #${orderNumber}`)}
    <p>Hi ${customerName}, we tried to place a hold on your card ahead of preparing your Christmas order, but it
    wasn't accepted. This can happen if a card has expired or changed since you ordered.</p>
    ${emailAlert(
      `Please <strong>contact us as soon as possible</strong> so we can take payment another way, your order
      can't be prepared until this is sorted.`
    )}
  `);

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

/** Staff-side counterpart to sendPreOrderAuthFailedEmail - flags the order for follow-up, since
 * it won't move into the normal /admin/orders capture queue until payment is resolved. */
export async function sendAdminPreOrderAuthFailedAlert(input: AdminPreOrderAuthFailedInput) {
  const { orderNumber, customerName, customerEmail, reason } = input;
  const to = getServerEnv().ADMIN_NOTIFICATION_EMAIL;

  const html = emailShell(`
    ${emailHeading(`Pre-order #${orderNumber} needs attention`)}
    <p>Scheduled re-authorisation failed for ${customerName} (${customerEmail}): ${reason}</p>
    <p style="font-size:13px;color:${COLORS.textLight};">The customer has been asked to get in touch. This order
    won't appear in the normal capture queue until payment is resolved.</p>
  `);

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
