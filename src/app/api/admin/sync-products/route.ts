import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/staff-auth";
import { runProductSync } from "@/lib/sync-products";

export async function POST(request: Request) {
  // Defense-in-depth: proxy.ts already gates /api/admin/*, but per the framework's own guidance
  // a matcher/route refactor could silently drop that coverage, so re-check here too.
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runProductSync(request);
}
