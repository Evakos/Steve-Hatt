import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { SHOP_SETTINGS_TAG } from "@/lib/shop-settings";
import { getServerEnv } from "@/lib/env";

/**
 * WordPress calls this when someone saves Settings > Shop settings in wp-admin, so the shop picks the change
 * up straight away instead of at its next refresh, and refreshes the Vercel mirror of the settings. It carries
 * the shared secret (SHOP_SSO_SECRET). It only ever asks the shop to re-read WordPress, so a forged call can't
 * change a setting.
 */
export async function POST(request: Request) {
  const secret = process.env.SHOP_SSO_SECRET;
  const given = request.headers.get("x-shop-secret") ?? "";
  const a = Buffer.from(secret ?? "");
  const b = Buffer.from(given);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(SHOP_SETTINGS_TAG, { expire: 0 });

  // Refresh the Vercel mirror from what WordPress now holds, best effort.
  try {
    const env = getServerEnv();
    const res = await fetch(`${env.WOOCOMMERCE_URL}/wp-json/steve-hatt/v1/settings`, { cache: "no-store" });
    const data = (await res.json()) as { configured?: boolean; settings?: Record<string, unknown> };
    if (data.configured && data.settings && env.VERCEL_API_TOKEN && env.EDGE_CONFIG_ID) {
      const url = new URL(`https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items`);
      if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
      await fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ items: Object.entries(data.settings).map(([key, value]) => ({ operation: "upsert", key, value })) }),
      });
    }
  } catch {
    // The mirror catches up on the next change.
  }
  return NextResponse.json({ ok: true });
}
