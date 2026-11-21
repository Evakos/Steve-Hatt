import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Public and harmless: switches the staff "preview the closed shop" cookie off in this browser, then goes to the home page. */
export function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set("sh_preview_closed", "", { path: "/", maxAge: 0 });
  return res;
}
