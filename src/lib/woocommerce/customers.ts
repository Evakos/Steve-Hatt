import "server-only";
import { randomBytes } from "node:crypto";
import { wooFetch } from "./client";
import type { WooCustomer, WooCustomerInput } from "./types";

/** WooCommerce customers are matched by email — there's no separate "account exists" check
 * elsewhere, so every login/signup path goes through this first. */
export async function findCustomerByEmail(email: string): Promise<WooCustomer | undefined> {
  const matches = await wooFetch<WooCustomer[]>("customers", {
    searchParams: { email, per_page: 1 },
    next: { revalidate: 0 },
  });
  return matches.find((c) => c.email.toLowerCase() === email.toLowerCase());
}

export async function getCustomer(id: number): Promise<WooCustomer> {
  return wooFetch<WooCustomer>(`customers/${id}`, { next: { revalidate: 0 } });
}

/**
 * Creates a WooCommerce customer for a first-time magic-link sign-in. WooCommerce requires a
 * password on the underlying WordPress user even though this app never uses WP's own login —
 * see WooCustomerInput's password field — so one is generated here and immediately discarded.
 */
export async function createCustomer(email: string): Promise<WooCustomer> {
  const input: WooCustomerInput = {
    email,
    password: randomBytes(24).toString("hex"),
  };
  return wooFetch<WooCustomer>("customers", { method: "POST", body: input });
}

export async function updateCustomer(id: number, input: WooCustomerInput): Promise<WooCustomer> {
  return wooFetch<WooCustomer>(`customers/${id}`, { method: "PUT", body: input });
}

/**
 * Finds the existing customer for this email, or creates one — the single entry point used by
 * both /api/account/login (send the link) and /api/account/verify (land the session), so "sign
 * up" and "sign in" are the same action from the customer's perspective.
 *
 * Returns undefined if this email can never become a WooCommerce customer: WordPress enforces
 * globally-unique emails across every user role, but the /customers endpoint's search only
 * returns role=customer accounts — so an email already used by a non-customer WordPress user
 * (e.g. an administrator or shop manager) looks "not found" by findCustomerByEmail above, then
 * fails here with a 400 registration-error-email-exists from WordPress itself. There's no real
 * WooCommerce customer to return in that case. Callers should treat this the same as any other
 * "no customer_id" checkout (guest order), or, for the login flow, as a sign-in failure — see
 * create-order-from-payment.ts and api/account/verify/route.ts.
 */
export async function findOrCreateCustomerByEmail(email: string): Promise<WooCustomer | undefined> {
  const existing = await findCustomerByEmail(email);
  if (existing) return existing;
  try {
    return await createCustomer(email);
  } catch (err) {
    if (err instanceof Error && err.message.includes("registration-error-email-exists")) {
      return undefined;
    }
    throw err;
  }
}
