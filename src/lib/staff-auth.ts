import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "staff_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h - staff re-authenticate daily, not a long-lived token

/**
 * Minimal signed-cookie session for the /admin area - a single shared password
 * (STAFF_PASSWORD), not per-user accounts, matching the scale of what a single-shop staff
 * team needs. The cookie is `expiryTimestamp.hmac`, verified server-side on every /admin
 * request via middleware; no database/session store involved.
 */
function sign(expiry: number): string {
  const secret = getServerEnv().STAFF_SESSION_SECRET;
  return createHmac("sha256", secret).update(String(expiry)).digest("hex");
}

export function createSessionCookieValue(): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  return `${expiry}.${sign(expiry)}`;
}

export function isValidSessionCookieValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const [expiryStr, signature] = value.split(".");
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expected = sign(expiry);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
}

export const STAFF_COOKIE_NAME = COOKIE_NAME;
export const STAFF_SESSION_TTL_MS = SESSION_TTL_MS;

/** Server Component / Route Handler helper - throws nothing, just reports auth state. */
export async function isStaffAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionCookieValue(store.get(COOKIE_NAME)?.value);
}
