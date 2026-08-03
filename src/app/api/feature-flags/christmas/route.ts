import { NextResponse } from "next/server";
import { isChristmasShopActive } from "@/lib/feature-flags";

/** Public, unauthenticated — just exposes whether Christmas ordering is on, same as the
 * server-rendered check on the homepage/shop page, but callable from client components (e.g.
 * the cart page) that need it without a server-component wrapper. */
export async function GET() {
  return NextResponse.json({ active: await isChristmasShopActive() });
}
