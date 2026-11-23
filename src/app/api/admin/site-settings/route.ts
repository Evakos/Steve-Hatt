import { NextResponse } from "next/server";
import { z } from "zod";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { getSiteSettings } from "@/lib/site-settings";
import { updateSiteSettings } from "@/lib/edge-config-admin";

const updateSchema = z.object({
  // Who gets new-order alerts and contact messages. Empty falls back to the address set when the shop was built.
  notificationEmails: z.array(z.email()).max(10),
  testOrderMode: z.boolean(),
  bannerText: z.string().max(200),
  closedMessage: z.string().max(400),
  dayNotes: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().min(1).max(200) })).max(20),
  openingHours: z.object({
    title: z.string().max(100),
    intro: z.string().max(200),
    footnote: z.string().max(300),
    days: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          closed: z.boolean(),
          opens: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          closes: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        })
      )
      .max(70),
  }),
});

export async function GET() {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSiteSettings());
}

export async function POST(request: Request) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    await updateSiteSettings(parsed.data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 502 });
  }
  return NextResponse.json({ status: "ok", ...parsed.data });
}
