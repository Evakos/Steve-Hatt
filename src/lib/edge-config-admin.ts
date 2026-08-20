import "server-only";
import { getServerEnv } from "@/lib/env";

/**
 * Writes to Edge Config via the Vercel REST API - a completely separate credential from the
 * EDGE_CONFIG connection string used everywhere else (see feature-flags.ts), which is read-only
 * by design. Only used by the staff-authenticated /admin/guide controls; every other read in the
 * app never touches this.
 */
export interface ChristmasSettings {
  active: boolean;
  premiumPercent: number;
  /** Fixed deposit (£) captured at checkout on Christmas pre-orders - 0 disables it. */
  christmasDepositAmount: number;
}

export async function updateChristmasSettings(input: ChristmasSettings): Promise<void> {
  const env = getServerEnv();
  if (!env.VERCEL_API_TOKEN || !env.EDGE_CONFIG_ID) {
    throw new Error(
      "Christmas settings can't be saved - VERCEL_API_TOKEN and EDGE_CONFIG_ID aren't configured (see .env.example)."
    );
  }

  const url = new URL(`https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items`);
  if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        { operation: "upsert", key: "christmasShopActive", value: input.active },
        { operation: "upsert", key: "christmasPremiumPercent", value: input.premiumPercent },
        { operation: "upsert", key: "christmasDepositAmount", value: input.christmasDepositAmount },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Edge Config update failed (${res.status}): ${text}`);
  }
}
