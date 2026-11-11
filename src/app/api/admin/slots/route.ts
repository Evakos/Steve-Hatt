import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getDisabledSlots } from "@/lib/feature-flags";
import { updateDisabledSlots } from "@/lib/edge-config-admin";
import { SLOT_KEY_PATTERN, slotDateKey } from "@/lib/slots";

const updateSchema = z.object({
  disabledSlots: z.array(z.string().regex(SLOT_KEY_PATTERN)).max(500),
});

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ disabledSlots: await getDisabledSlots() });
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

  // Drop duplicates and anything for a day that has already passed, so the list never grows.
  const today = slotDateKey(new Date());
  const disabledSlots = [...new Set(parsed.data.disabledSlots)].filter((key) => key.slice(0, 10) >= today).sort();

  try {
    await updateDisabledSlots(disabledSlots);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "ok", disabledSlots });
}
