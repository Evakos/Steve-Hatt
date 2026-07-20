import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "customer_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — customers expect to stay signed in
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes — long enough to find the email, short enough to matter

/**
 * Passwordless customer auth: signing in and signing up are the same action — enter an email,
 * get a link, click it. No password is ever set or checked (WooCommerce still requires one on
 * the underlying WP user record, but it's a random throwaway value — see woocommerce/customers.ts).
 *
 * Two HMAC-signed, self-contained token types, both `${payload}.${expiry}.${signature}`, no
 * database — same pattern as staff-auth.ts. A `purpose` tag is baked into what gets signed so a
 * captured magic-link token can't be replayed as a session cookie or vice versa.
 */
function sign(purpose: "link" | "session", payload: string, expiry: number): string {
  const secret = getServerEnv().CUSTOMER_SESSION_SECRET;
  return createHmac("sha256", secret).update(`${purpose}.${payload}.${expiry}`).digest("hex");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

export function createMagicLinkToken(email: string): string {
  const expiry = Date.now() + MAGIC_LINK_TTL_MS;
  const payload = Buffer.from(email).toString("base64url");
  return `${payload}.${expiry}.${sign("link", payload, expiry)}`;
}

/** Returns the email if the token is valid and unexpired, otherwise null. */
export function verifyMagicLinkToken(token: string): string | null {
  const [payload, expiryStr, signature] = token.split(".");
  if (!payload || !expiryStr || !signature) return null;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
  if (!timingSafeEqualStrings(sign("link", payload, expiry), signature)) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

export function createCustomerSessionCookieValue(customerId: number): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = String(customerId);
  return `${payload}.${expiry}.${sign("session", payload, expiry)}`;
}

/** Returns the customer id if the cookie is valid and unexpired, otherwise null. */
export function verifyCustomerSessionCookieValue(value: string | undefined | null): number | null {
  if (!value) return null;
  const [payload, expiryStr, signature] = value.split(".");
  if (!payload || !expiryStr || !signature) return null;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
  if (!timingSafeEqualStrings(sign("session", payload, expiry), signature)) return null;

  const customerId = Number(payload);
  return Number.isFinite(customerId) && customerId > 0 ? customerId : null;
}

export const CUSTOMER_COOKIE_NAME = COOKIE_NAME;
export const CUSTOMER_SESSION_TTL_MS = SESSION_TTL_MS;

/** Server Component / Route Handler helper — returns the signed-in customer id, or null. */
export async function getCustomerSession(): Promise<number | null> {
  const store = await cookies();
  return verifyCustomerSessionCookieValue(store.get(COOKIE_NAME)?.value);
}
