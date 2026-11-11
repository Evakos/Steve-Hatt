import { NextResponse } from "next/server";
import { isChristmasShopActive, getChristmasPremiumPercent, getChristmasUseDepositFlow, areOnlineOrdersClosed } from "@/lib/feature-flags";

/** Public, unauthenticated - just exposes whether Christmas ordering is on (and its current
 * payment model), same as the server-rendered check on the homepage/shop page, but callable
 * from client components (e.g. the cart and checkout pages) that need it without a server-
 * component wrapper. */
export async function GET() {
  const [active, premiumPercent, useDepositFlow] = await Promise.all([
    isChristmasShopActive(),
    getChristmasPremiumPercent(),
    getChristmasUseDepositFlow(),
  ]);
  // ordersClosed: the Christmas break (after 17th December until the new year) - the whole shop
  // stops taking online orders, not just the Christmas range.
  return NextResponse.json({ active, premiumPercent, useDepositFlow, ordersClosed: await areOnlineOrdersClosed() });
}
