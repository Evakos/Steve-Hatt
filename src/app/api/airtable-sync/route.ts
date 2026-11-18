import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runProductSync } from "@/lib/sync-products";

/**
 * Called by an Airtable automation the moment a product or size row changes, so the shop updates
 * without anyone pressing "Sync now". It carries a shared secret instead of a staff login, and only
 * ever pushes what is already in the sheet into the shop (Airtable is never written to).
 *
 * Body: { "recordId": "recXXXXXXXXXXXXXX" }. Without a recordId the whole sheet is synced.
 */

// A burst of edits arrives as several requests at once. Running them one after another on this
// instance stops two runs from adding the same new product twice.
let queue: Promise<unknown> = Promise.resolve();

function secretMatches(header: string | null): boolean {
  const secret = process.env.AIRTABLE_SYNC_SECRET;
  if (!secret || !header) return false;
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let recordId: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.recordId === "string" && body.recordId.trim()) recordId = body.recordId.trim();
  } catch {
    // No body means a full sync.
  }

  const run = queue.then(() => runProductSync(request, { recordId }));
  queue = run.catch(() => undefined);
  return run;
}
