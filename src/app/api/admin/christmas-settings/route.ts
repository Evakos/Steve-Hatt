import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getChristmasShopActiveRaw, getChristmasPremiumPercent, getChristmasDepositAmount, getChristmasUseDepositFlow, getOrdersReopenDate, getLastOrderDate, getChristmasOpenDate, getChristmasDates } from "@/lib/feature-flags";
import { updateChristmasSettings } from "@/lib/edge-config-admin";

const updateSchema = z.object({
  active: z.boolean(),
  premiumPercent: z.number().min(0).max(100),
  christmasDepositAmount: z.number().nonnegative(),
  christmasUseDepositFlow: z.boolean(),
  // A January day (YYYY-MM-DD) or "" for the default 4th January.
  ordersReopenDate: z.string().regex(/^(\d{4}-01-(0[1-9]|[12]\d|3[01]))?$/).optional(),
  // The Christmas delivery and collection days: December dates up to the 24th, [] for none.
  christmasSlotDates: z.array(z.string().regex(/^\d{4}-12-(0[1-9]|1\d|2[0-4])$/)).max(24).optional(),
  // A date from October to December (YYYY-MM-DD) or "" for none.
  christmasOpenDate: z.string().regex(/^(\d{4}-(10|11|12)-(0[1-9]|[12]\d|3[01]))?$/).optional(),
  // A December day up to the 24th (YYYY-12-DD) or "" for none.
  lastOrderDate: z.string().regex(/^(\d{4}-12-(0[1-9]|1\d|2[0-4]))?$/).optional(),
});

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [active, premiumPercent, christmasDepositAmount, christmasUseDepositFlow, ordersReopenDate, lastOrderDate, christmasOpenDate, christmasSlotDates] = await Promise.all([
    getChristmasShopActiveRaw(),
    getChristmasPremiumPercent(),
    getChristmasDepositAmount(),
    getChristmasUseDepositFlow(),
    getOrdersReopenDate(),
    getLastOrderDate(),
    getChristmasOpenDate(),
    getChristmasDates(),
  ]);
  return NextResponse.json({ active, premiumPercent, christmasDepositAmount, christmasUseDepositFlow, ordersReopenDate, lastOrderDate, christmasOpenDate, christmasSlotDates });
}

export async function POST(request: Request) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await updateChristmasSettings(parsed.data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "ok", ...parsed.data });
}
