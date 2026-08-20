import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getChristmasShopActiveRaw, getChristmasPremiumPercent, getChristmasDepositAmount } from "@/lib/feature-flags";
import { updateChristmasSettings } from "@/lib/edge-config-admin";

const updateSchema = z.object({
  active: z.boolean(),
  premiumPercent: z.number().min(0).max(100),
  christmasDepositAmount: z.number().nonnegative(),
});

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [active, premiumPercent, christmasDepositAmount] = await Promise.all([
    getChristmasShopActiveRaw(),
    getChristmasPremiumPercent(),
    getChristmasDepositAmount(),
  ]);
  return NextResponse.json({ active, premiumPercent, christmasDepositAmount });
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
