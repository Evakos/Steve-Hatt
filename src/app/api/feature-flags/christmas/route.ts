import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBannerText, getClosedMessage, getDayNotes, getOpeningDays } from "@/lib/site-settings";
import { isChristmasShopActive, getChristmasPremiumPercent, getChristmasUseDepositFlow, areOnlineOrdersClosed, getDisabledSlots, getSlotsEnabled, getLastOrderLabel, getChristmasDates, getClosingLabel, getReopenLabel, getOrdersReopenDate } from "@/lib/feature-flags";

/** Public, unauthenticated - just exposes whether Christmas ordering is on (and its current
 * payment model), same as the server-rendered check on the homepage/shop page, but callable
 * from client components (e.g. the cart and checkout pages) that need it without a server-
 * component wrapper. */
export async function GET(request: NextRequest) {
  // Staff previewing the closed shop (see /admin/preview-closed): report it closed to this browser only.
  const preview = request.cookies.get("sh_preview_closed")?.value === "1";
  const [active, premiumPercent, useDepositFlow, disabledSlots, slotsEnabled] = await Promise.all([
    isChristmasShopActive(),
    getChristmasPremiumPercent(),
    getChristmasUseDepositFlow(),
    getDisabledSlots(),
    getSlotsEnabled(),
  ]);
  // ordersClosed: the Christmas break (after 17th December until the new year) - the whole shop
  // stops taking online orders, not just the Christmas range.
  return NextResponse.json({ active, premiumPercent, useDepositFlow, disabledSlots, slotsEnabled, lastOrderLabel: await getLastOrderLabel(), christmasDates: await getChristmasDates(), closingLabel: await getClosingLabel(), bannerText: await getBannerText(), closedMessage: await getClosedMessage(), dayNotes: await getDayNotes(), openingDays: await getOpeningDays(), reopenLabel: await getReopenLabel(), reopenDate: await getOrdersReopenDate(), ordersClosed: preview || (await areOnlineOrdersClosed()), preview });
}
