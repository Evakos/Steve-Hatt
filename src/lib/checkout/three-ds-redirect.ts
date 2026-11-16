import type { Pay360ThreeDSChallenge } from "@/lib/cardstream/types";

/** What the checkout page needs to send the shopper to their bank: a form to post, with these fields. */
export interface BankRedirect {
  kind: "redirect";
  url: string;
  fields: Record<string, string>;
}

export function isBankRedirect(value: unknown): value is BankRedirect {
  return typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === "redirect";
}

/**
 * Turns Pay360's 3-D Secure answer into the form the bank page expects (the same two forms the old
 * WordPress plugin posted). `notifyUrl` is where the bank sends the shopper back, and `md` is handed
 * back untouched so we know which order it was.
 */
export function buildBankRedirect(raw: Pay360ThreeDSChallenge, notifyUrl: string, md: string): BankRedirect | undefined {
  if (raw.version === 1 && raw.pareq) {
    return { kind: "redirect", url: raw.url, fields: { PaReq: raw.pareq, TermUrl: notifyUrl, MD: md } };
  }
  if (raw.version === 2 && raw.threeDSServerTransId) {
    return {
      kind: "redirect",
      url: raw.url,
      fields: { transactionId: raw.threeDSServerTransId, notificationUrl: notifyUrl, MD: md },
    };
  }
  return undefined;
}
