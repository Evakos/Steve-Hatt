import { NextResponse } from "next/server";
import {
  readMagicLinkToken,
  createCustomerSessionCookieValue,
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_TTL_MS,
} from "@/lib/customer-auth";
import { findOrCreateCustomerByEmail, getCustomer, updateCustomer } from "@/lib/woocommerce/customers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const link = token ? readMagicLinkToken(token) : null;
  const email = link?.email ?? null;

  if (!email) {
    return NextResponse.redirect(new URL("/account/login?error=expired", request.url));
  }

  // First click for a new email creates the account - sign-in and sign-up are the same action.
  const customer = await findOrCreateCustomerByEmail(email);
  if (!customer) {
    // This email already belongs to a non-customer WordPress user (e.g. an administrator) -
    // see findOrCreateCustomerByEmail. There's no customer account to sign into.
    return NextResponse.redirect(new URL("/account/login?error=unavailable", request.url));
  }

  // Save the postcode they checked on the homepage, but never overwrite one they already have, and
  // never let a failure here get in the way of signing in.
  if (link?.postcode) {
    try {
      const current = await getCustomer(customer.id);
      if (!current.billing.postcode) {
        await updateCustomer(customer.id, { email: customer.email, billing: { postcode: link.postcode, country: "GB" } });
      }
    } catch (err) {
      console.error("Couldn't save postcode to new account", err);
    }
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
