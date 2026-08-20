import { NextResponse } from "next/server";
import { isChristmasShopActive, getChristmasPremiumPercent } from "@/lib/feature-flags";

/** Public, unauthenticated - just exposes whether Christmas ordering is on (and its premium %),
 * same as the server-rendered check on the homepage/shop page, but callable from client
 * components (e.g. the cart and checkout pages) that need it without a server-component wrapper. */
export async function GET() {
  const [active, premiumPercent] = await Promise.all([isChristmasShopActive(), getChristmasPremiumPercent()]);
  return NextResponse.json({ active, premiumPercent });
}
