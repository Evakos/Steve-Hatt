import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSessionCookieValue, STAFF_COOKIE_NAME, STAFF_SESSION_TTL_MS } from "@/lib/staff-auth";

/**
 * Signs a staff member in from WordPress. The "Shop admin" menu in wp-admin sends the logged-in
 * administrator here with a short-lived signed token (p = base64url JSON {u, exp, to, n}, s = HMAC-SHA256
 * of "wp-sso:" + p, keyed with SHOP_SSO_SECRET, which the WordPress plugin also holds). If it checks out the normal staff session
 * cookie is set and they land on the page they asked for, with no second password.
 *
 * The token lasts 60 seconds and only /admin pages can be the destination. SHOP_SSO_ALLOWED_USERS
 * (comma separated WordPress usernames) can narrow who is accepted here as well as in WordPress.
 */
function toLogin(origin: string): NextResponse {
  return NextResponse.redirect(new URL("/admin/login", origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.SHOP_SSO_SECRET;
  const payload = url.searchParams.get("p") ?? "";
  const signature = url.searchParams.get("s") ?? "";
  if (!secret || !payload || !signature) return toLogin(url.origin);

  const expected = Buffer.from(createHmac("sha256", secret).update(`wp-sso:${payload}`).digest("hex"));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return toLogin(url.origin);

  let data: { u?: unknown; exp?: unknown; to?: unknown };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return toLogin(url.origin);
  }
  if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return toLogin(url.origin);

  const allowed = (process.env.SHOP_SSO_ALLOWED_USERS ?? "").split(",").map((u) => u.trim()).filter(Boolean);
  if (allowed.length > 0 && (typeof data.u !== "string" || !allowed.includes(data.u))) return toLogin(url.origin);

  const to = typeof data.to === "string" && /^\/admin(\/[A-Za-z0-9_\-/]*)?$/.test(data.to) ? data.to : "/admin";
  const response = NextResponse.redirect(new URL(to, url.origin));
  response.cookies.set(STAFF_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_MS / 1000,
  });
  return response;
}
