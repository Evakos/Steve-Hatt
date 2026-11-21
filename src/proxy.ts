import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSessionCookieValue, STAFF_COOKIE_NAME } from "@/lib/staff-auth";
import { verifyCustomerSessionCookieValue, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";

// Paths inside /account and /api/account that must stay reachable without a session - the
// sign-in flow itself (request a link, click it, and clearing a cookie that may not exist).
const CUSTOMER_PUBLIC_PATHS = new Set([
  "/account/login",
  "/api/account/login",
  "/api/account/verify",
  "/api/account/logout",
]);

/**
 * Gates /admin/* (staff) and /account/* (customer) behind their respective signed-cookie
 * sessions. Defense-in-depth note (see proxy.md "Good to know"): a matcher change or route
 * refactor can silently remove this coverage, so protected pages/routes also re-check
 * isStaffAuthenticated()/getCustomerSession() themselves rather than trusting this alone.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Login must be reachable without a session; logout must also work when the cookie is
    // missing or already expired, otherwise the user couldn't clear it. /admin/sso is where WordPress
    // sends a signed-in administrator, and checks its own signed token.
    if (pathname === "/admin/login" || pathname === "/api/admin/login" || pathname === "/api/admin/logout" || pathname === "/admin/sso") {
      return NextResponse.next();
    }
    const cookie = request.cookies.get(STAFF_COOKIE_NAME)?.value;
    if (isValidSessionCookieValue(cookie)) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Staff sign in once, at the WordPress login. From there the shop admin signs them in automatically
    // (see /admin/sso), landing on the page they asked for. /admin/login stays as a fallback.
    const backend = process.env.WOOCOMMERCE_URL?.replace(/\/$/, "");
    if (backend) {
      const back = `${backend}/wp-admin/admin-post.php?action=sh_open_shop_admin&to=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(`${backend}/wp-login.php?redirect_to=${encodeURIComponent(back)}`);
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/api/account")) {
    if (CUSTOMER_PUBLIC_PATHS.has(pathname)) {
      return NextResponse.next();
    }
    const cookie = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (verifyCustomerSessionCookieValue(cookie)) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/account")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/api/account/:path*"],
};
