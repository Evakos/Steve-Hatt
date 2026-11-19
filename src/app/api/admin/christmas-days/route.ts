import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getChristmasDates } from "@/lib/feature-flags";
import { updateChristmasSlotDates } from "@/lib/edge-config-admin";

// December dates up to the 24th (YYYY-12-DD). An empty list means no Christmas days are picked.
const updateSchema = z.object({ days: z.array(z.string().regex(/^\d{4}-12-(0[1-9]|1\d|2[0-4])$/)).max(24) });

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ days: await getChristmasDates() });
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

  const days = [...new Set(parsed.data.days)].sort();
  try {
    await updateChristmasSlotDates(days);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "ok", days });
}
