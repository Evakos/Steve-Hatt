import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getSlotsEnabled } from "@/lib/feature-flags";
import { updateSlotsEnabled } from "@/lib/edge-config-admin";

const updateSchema = z.object({ enabled: z.boolean() });

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: await getSlotsEnabled() });
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
    await updateSlotsEnabled(parsed.data.enabled);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "ok", enabled: parsed.data.enabled });
}
