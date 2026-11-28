"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WooOrder } from "@/lib/woocommerce/types";
import { DeliveryBox, Field, OrderBody, OrderItems, OrderTile, OrderTop, orderMeta, parseWooPrice, toTitleCase } from "./order-parts";

const WP_ADMIN_URL = "https://api.stevehattfishmongers.co.uk/wp-admin";

interface Props {
  order: WooOrder;
}

export default function CompleteOrderCard({ order }: Props) {
  const router = useRouter();
  const slotLabel = orderMeta(order, "_checkout_slot_label") as string | undefined;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refunded, setRefunded] = useState(false);

  async function handleComplete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to mark complete");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function openWpOrder() {
    window.open(`${WP_ADMIN_URL}/post.php?post=${order.id}&action=edit`, "_blank", "noopener,noreferrer");
    setRefunded(true);
  }

  function openPrintSlip() {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Please allow popups for this site to print order slips.");
      return;
    }
    const isDelivery = orderMeta(order, "_checkout_fulfilment_type") === "delivery";
    const isChristmas = orderMeta(order, "_checkout_is_christmas") === "true";
    const customerName = toTitleCase(`${order.billing.first_name} ${order.billing.last_name}`.trim());
    const customerPhone = order.billing.phone;
    const customerEmail = order.billing.email;
    const address = isDelivery
      ? [order.shipping?.address_1, order.shipping?.address_2, order.shipping?.city, order.shipping?.postcode].filter(Boolean).join(", ")
      : "Click & Collect";
    const dateCreated = new Date(order.date_created).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Order #${order.number} - Print Slip</title>
  <style>
    @page { margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #111; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #242E67; padding-bottom: 12px; margin-bottom: 16px; }
    .logo { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #242E67; margin-bottom: 4px; }
    .tagline { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .address { font-size: 11px; color: #444; margin-bottom: 4px; }
    .order-info { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 11px; }
    .order-info .label { color: #666; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .order-info .value { font-weight: 600; color: #111; }
    .badges { display: flex; gap: 8px; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 999px; }
    .badge-delivery { background: #f27052; color: #fff; }
    .badge-collection { background: #2a5f8f; color: #fff; }
    .badge-christmas { background: #1f7a4d; color: #fff; }
    .badge-standard { background: #f0ebe3; color: #6b7280; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #666; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
    .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .customer-field .label { color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px; }
    .customer-field .value { font-weight: 600; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .items-table th, .items-table td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    .items-table th { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #666; font-size: 10px; }
    .items-table .qty { text-align: center; width: 40px; }
    .items-table .price { text-align: right; width: 70px; font-weight: 600; }
    .item-name { font-weight: 600; }
    .item-detail { font-size: 10px; color: #666; margin-top: 2px; }
    .totals { width: 100%; font-size: 11px; margin-top: 8px; }
    .totals td { padding: 4px 0; }
    .totals .label { color: #666; }
    .totals .value { text-align: right; font-weight: 600; }
    .totals .grand { border-top: 2px solid #242E67; font-weight: 700; font-size: 13px; color: #242E67; }
    .notes { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 11px; color: #444; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    button.no-print { margin-top: 16px; padding: 8px 16px; background: #f27052; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save as PDF</button>
  <div class="header">
    <div class="logo">Steve Hatt Fishmongers</div>
    <div class="tagline">Est. 1895</div>
    <div class="address">88-89 Essex Road, Islington, London N1 8LU</div>
    <div class="address">Tel: 020 7226 3963</div>
  </div>

  <div class="order-info">
    <div><span class="label">Order #</span> <span class="value">${order.number}</span></div>
    <div><span class="label">Date</span> <span class="value">${dateCreated}</span></div>
    <div><span class="label">Status</span> <span class="value">${order.status}</span></div>
  </div>

  <div class="badges">
    <span class="badge ${isDelivery ? "badge-delivery" : "badge-collection"}">${isDelivery ? "Delivery" : "Collection"}</span>
    <span class="badge ${isChristmas ? "badge-christmas" : "badge-standard"}">${isChristmas ? "Christmas Order" : "Standard Order"}</span>
  </div>

  <div class="section">
    <div class="section-title">Customer</div>
    <div class="customer-grid">
      <div class="customer-field"><div class="label">Name</div><div class="value">${customerName || "—"}</div></div>
      <div class="customer-field"><div class="label">Phone</div><div class="value">${customerPhone || "—"}</div></div>
      <div class="customer-field"><div class="label">Email</div><div class="value">${customerEmail || "—"}</div></div>
      <div class="customer-field"><div class="label">${isDelivery ? "Delivery to" : "Collect from"}</div><div class="value">${address}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">When</div>
    <div style="font-weight: 600;">${slotLabel || "Not set"}</div>
  </div>

  <div class="section">
    <div class="section-title">Items (${order.line_items.length})</div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="qty">Qty</th>
          <th>Item</th>
          <th class="price">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.line_items.map((li) => {
          const weight = li.meta_data.find((m) => m.key === "Weight (estimated)")?.value as string | undefined;
          const prep = li.meta_data.find((m) => m.key === "Preparation")?.value as string | undefined;
          return `
          <tr>
            <td class="qty">${li.quantity}×</td>
            <td>
              <div class="item-name">${li.name}</div>
              ${prep || weight ? `<div class="item-detail">${[prep, weight ? `est. ${weight}` : ""].filter(Boolean).join(" · ")}</div>` : ""}
            </td>
            <td class="price">£${parseWooPrice(li.total).toFixed(2)}</td>
          </tr>
        `}).join("")}
      </tbody>
    </table>
  </div>

  <table class="totals">
    <tr><td class="label">Subtotal</td><td class="value">£${parseWooPrice(String(orderMeta(order, "_checkout_subtotal") ?? order.line_items.reduce((sum, li) => sum + parseWooPrice(String(li.total)), 0))).toFixed(2)}</td></tr>
    ${isDelivery ? `<tr><td class="label">Delivery</td><td class="value">£${parseWooPrice(String(orderMeta(order, "_checkout_delivery_fee") ?? "0")).toFixed(2)}</td></tr>` : ""}
    <tr class="grand"><td class="label">Total</td><td class="value">£${parseWooPrice(String(order.total)).toFixed(2)}</td></tr>
  </table>

  ${(() => {
    const notes = order.meta_data.filter(m => ["_checkout_order_ref", "Closing time", "_checkout_slot_date", "_checkout_slot_label"].includes(m.key));
    if (notes.length === 0) return "";
    return `
    <div class="notes">
      <strong>Notes:</strong>
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        ${notes.map(n => `<li>${n.key}: ${n.value}</li>`).join("")}
      </ul>
    </div>
    `;
  })()}

  <div class="footer">
    Steve Hatt Fishmongers · 88-89 Essex Road, Islington, London N1 8LU · 020 7226 3963
  </div>
</body>
</html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <OrderTile className={refunded ? "opacity-40 transition-opacity duration-300" : ""}>
      <OrderTop order={order} />
      <OrderBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label="When">
            <span className="font-medium">{slotLabel ?? "Not set"}</span>
          </Field>
          <Field label="Paid" className="text-right">
            <span className="text-base font-semibold">£{parseWooPrice(order.total).toFixed(2)}</span>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Placed">
            <span className="font-medium">{new Date(order.date_created).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
          </Field>
        </div>
        <DeliveryBox order={order} />
        <OrderItems order={order} />
        <div className="mt-auto flex flex-col gap-2">
          {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="w-full bg-teal px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "6px" }}
          >
            {submitting ? "Completing…" : "Mark complete"}
          </button>
          <button
            type="button"
            onClick={openPrintSlip}
            className="w-full bg-navy px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            style={{ borderRadius: "6px" }}
          >
            Print slip
          </button>
          <button
            type="button"
            onClick={openWpOrder}
            disabled={refunded}
            className="w-full bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "6px" }}
          >
            {refunded ? "Refunded (opened WordPress)" : "Refund in WordPress"}
          </button>
        </div>
      </OrderBody>
    </OrderTile>
  );
}
