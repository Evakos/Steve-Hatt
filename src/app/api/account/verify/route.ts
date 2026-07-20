import { NextResponse } from "next/server";
import {
  verifyMagicLinkToken,
  createCustomerSessionCookieValue,
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_TTL_MS,
} from "@/lib/customer-auth";
import { findOrCreateCustomerByEmail } from "@/lib/woocommerce/customers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = token ? verifyMagicLinkToken(token) : null;

  if (!email) {
    return NextResponse.redirect(new URL("/account/login?error=expired", request.url));
  }

  // First click for a new email creates the account — sign-in and sign-up are the same action.
  const customer = await findOrCreateCustomerByEmail(email);
  if (!customer) {
    // This email already belongs to a non-customer WordPress user (e.g. an administrator) —
    // see findOrCreateCustomerByEmail. There's no customer account to sign into.
    return NextResponse.redirect(new URL("/account/login?error=unavailable", request.url));
  }

  const response = NextResponse.redirect(new URL("/account", request.url));
  response.cookies.set(CUSTOMER_COOKIE_NAME, createCustomerSessionCookieValue(customer.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL_MS / 1000,
  });
  return response;
}
