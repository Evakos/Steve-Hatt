import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Staff only (the proxy gates /admin). Switches on a "preview the closed shop" cookie in this browser, then sends them to the
 * shop. While it is set, the public flags endpoint reports the shop as closed to this browser only, so the banner, pop-up,
 * disabled Add to basket buttons and the checkout message can all be checked without closing the real shop. The cookie lasts
 * an hour, is readable by the page so the "Exit preview" bar can clear it, and never affects what the server accepts.
 */
export const PREVIEW_CLOSED_COOKIE = "sh_preview_closed";

export function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") ?? "/";
  const target = to.startsWith("/") && !to.startsWith("//") ? to : "/";
  const res = NextResponse.redirect(new URL(target, request.url));
  res.cookies.set(PREVIEW_CLOSED_COOKIE, "1", { path: "/", maxAge: 60 * 60, sameSite: "lax", httpOnly: false });
  return res;
}
