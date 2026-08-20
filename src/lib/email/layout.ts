/**
 * Shared visual layer for every transactional email - mirrors the site's actual brand palette
 * (src/app/globals.css custom properties) and font choices, since email clients can't read the
 * site's CSS. Playfair Display/DM Sans (the site's actual fonts) aren't reliably available in
 * email clients, so headings/body use close web-safe equivalents instead of trying to load them.
 */

export const COLORS = {
  navy: "#242E67",
  cream: "#faf8f5",
  sand: "#f0ebe3",
  ocean: "#2a5f8f",
  oceanLight: "#e8f1f8",
  lobster: "#f27052",
  lobsterLight: "#fef0ec",
  teal: "#42c4a8",
  text: "#374151",
  textLight: "#6b7280",
  border: "#e5e7eb",
} as const;

const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

export const SITE_URL = "https://steve-hatt-demo.vercel.app";
const LOGO_URL = `${SITE_URL}/logo-email.png`;

/** Wraps a block of body HTML in a full HTML document (explicit UTF-8 charset - without it,
 * literal non-ASCII characters in dynamic content, e.g. the "·" in a formatted slot label, get
 * misread as Latin-1 by some email clients and render as garbled "Â·") with the branded card:
 * logo header, lobster accent line, cream footer with the shop address. Every email function
 * should pass its content through this. */
export function emailShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;">
    <div style="background:${COLORS.sand};padding:32px 16px;font-family:${FONT_SANS};">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${COLORS.border};">
        <div style="background:#ffffff;padding:28px 24px 20px;text-align:center;">
          <img src="${LOGO_URL}" width="160" alt="Steve Hatt Fishmongers" style="display:block;margin:0 auto;height:auto;max-width:160px;" />
        </div>
        <div style="height:4px;background:${COLORS.lobster};"></div>
        <div style="padding:32px 28px;color:${COLORS.text};font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </div>
        <div style="background:${COLORS.cream};padding:20px 28px;text-align:center;border-top:1px solid ${COLORS.border};">
          <p style="margin:0;font-size:12px;color:${COLORS.textLight};">
            Steve Hatt Fishmongers &middot; 88 Essex Road, Islington, London N1 8LU
          </p>
        </div>
      </div>
    </div>
</body>
</html>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:22px;font-weight:700;color:${COLORS.navy};">${text}</h1>`;
}

/** A callout box for informational/reassuring notices (e.g. "not charged yet") - ocean, not
 * lobster, since lobster is reserved for primary actions/urgent notices, matching the site's own
 * use of ocean-light callouts for "fair pricing" style reassurance copy. */
export function emailNotice(html: string): string {
  return `
    <div style="background:${COLORS.oceanLight};border:1px solid ${COLORS.ocean}33;border-radius:5px;padding:14px 16px;margin:0 0 20px;font-size:13px;color:${COLORS.navy};">
      ${html}
    </div>
  `;
}

/** A callout box for something that needs the reader's attention/action. */
export function emailAlert(html: string): string {
  return `
    <div style="background:${COLORS.lobsterLight};border:1px solid ${COLORS.lobster}55;border-radius:5px;padding:14px 16px;margin:0 0 20px;font-size:13px;color:${COLORS.navy};">
      ${html}
    </div>
  `;
}

export function emailButton(href: string, label: string): string {
  return `
    <p style="margin:24px 0;text-align:center;">
      <a href="${href}" style="background:${COLORS.lobster};color:#ffffff;padding:12px 28px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        ${label}
      </a>
    </p>
  `;
}

export interface EmailLineItem {
  productName: string;
  quantity: number;
  preparation?: string;
  weight?: number;
  lineTotal: number;
}

/** Itemised line-item table shared by every order email - quantity, name, prep/weight detail,
 * and price per line, not just a total. */
export function emailLineItemsTable(items: EmailLineItem[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;">
            <div style="font-weight:600;color:${COLORS.navy};">${item.quantity} &times; ${item.productName}</div>
            ${item.preparation ? `<div style="margin-top:2px;font-size:12px;color:${COLORS.textLight};">${item.preparation}</div>` : ""}
            ${item.weight ? `<div style="font-size:12px;color:${COLORS.textLight};">${item.weight}kg estimated</div>` : ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};text-align:right;vertical-align:top;font-weight:600;color:${COLORS.navy};white-space:nowrap;">
            &pound;${item.lineTotal.toFixed(2)}
          </td>
        </tr>
      `
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`;
}

export function emailTotalRow(label: string, amount: number, opts?: { bold?: boolean }): string {
  const weight = opts?.bold ? "font-weight:700;" : "";
  return `
    <tr>
      <td style="padding:6px 0;color:${COLORS.text};${weight}">${label}</td>
      <td style="padding:6px 0;text-align:right;color:${COLORS.navy};${weight}">&pound;${amount.toFixed(2)}</td>
    </tr>
  `;
}
