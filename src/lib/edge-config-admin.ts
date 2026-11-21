import "server-only";
import { revalidateTag } from "next/cache";
import { getServerEnv } from "@/lib/env";
import { SHOP_SETTINGS_TAG } from "@/lib/shop-settings";

/**
 * Saves the shop's settings. WordPress is the source of truth: every change is posted to
 * /wp-json/steve-hatt/v1/settings (Settings > Shop settings in wp-admin shows the same values). Vercel's
 * Edge Config is kept as a mirror, updated best effort, so the shop still has the latest values if
 * WordPress is briefly unreachable. Only used by the staff-authenticated /admin controls.
 */

export interface ChristmasSettings {
  active: boolean;
  premiumPercent: number;
  /** Fixed deposit (£) captured at checkout on Christmas pre-orders - 0 disables it. */
  christmasDepositAmount: number;
  /**
   * When true, switches Christmas orders onto the legacy deposit/part-payment flow
   * (deposit captured at checkout, card verified, balance re-authorised + captured later).
   * False (the default) keeps the simple full-payment-upfront model - the whole legacy flow is
   * gated on this being on. See src/lib/feature-flags.ts.
   */
  christmasUseDepositFlow: boolean;
  /**
   * January date (YYYY-MM-DD) on which online ordering reopens after the Christmas break. "" means
   * the default, 4th January. Left untouched when undefined. See src/lib/ordering-window.ts.
   */
  ordersReopenDate?: string;
  /** December date (YYYY-12-DD) of the last day for Christmas orders. "" means none is set. */
  lastOrderDate?: string;
  /** Date (YYYY-MM-DD, October to December) Christmas orders open. "" means none is set. */
  christmasOpenDate?: string;
  /** The Christmas delivery and collection days (YYYY-12-DD). [] means none picked. */
  christmasSlotDates?: string[];
}

/** Updates Vercel's settings store to match. Best effort: WordPress already has the change. */
async function mirrorToEdgeConfig(changes: Record<string, unknown>): Promise<void> {
  const env = getServerEnv();
  if (!env.VERCEL_API_TOKEN || !env.EDGE_CONFIG_ID) return;
  try {
    const url = new URL(`https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items`);
    if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
    await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ items: Object.entries(changes).map(([key, value]) => ({ operation: "upsert", key, value })) }),
    });
  } catch {
    // The mirror catches up on the next save.
  }
}

/** Posts the changes to WordPress, then mirrors them and refreshes what the shop has cached. */
export async function saveShopSettings(changes: Record<string, unknown>): Promise<void> {
  const secret = process.env.SHOP_SSO_SECRET;
  if (!secret) {
    throw new Error("Settings can't be saved: SHOP_SSO_SECRET isn't set in Vercel, so the shop can't talk to WordPress.");
  }
  const res = await fetch(`${getServerEnv().WOOCOMMERCE_URL}/wp-json/steve-hatt/v1/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-shop-secret": secret },
    body: JSON.stringify(changes),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WordPress settings update failed (${res.status}): ${text}`);
  }
  await mirrorToEdgeConfig(changes);
  revalidateTag(SHOP_SETTINGS_TAG, { expire: 0 });
}

export async function updateChristmasSettings(input: ChristmasSettings): Promise<void> {
  await saveShopSettings({
    christmasShopActive: input.active,
    christmasPremiumPercent: input.premiumPercent,
    christmasDepositAmount: input.christmasDepositAmount,
    christmasUseDepositFlow: input.christmasUseDepositFlow,
    ...(input.ordersReopenDate !== undefined ? { ordersReopenDate: input.ordersReopenDate } : {}),
    ...(input.lastOrderDate !== undefined ? { lastOrderDate: input.lastOrderDate } : {}),
    ...(input.christmasOpenDate !== undefined ? { christmasOpenDate: input.christmasOpenDate } : {}),
    ...(input.christmasSlotDates !== undefined ? { christmasSlotDates: input.christmasSlotDates } : {}),
  });
}

/** Saves the list of switched-off delivery/collection slots (see src/lib/slots.ts). */
export async function updateDisabledSlots(slots: string[]): Promise<void> {
  await saveShopSettings({ disabledSlots: slots });
}

/** Saves the admin "Payment mode" switch: true is Pay360 sandbox, false is live (see feature-flags.ts). */
export async function updatePaymentSandboxMode(sandbox: boolean): Promise<void> {
  await saveShopSettings({ paymentSandboxMode: sandbox });
}

/** Saves the master "customers choose a time window" switch (see feature-flags.ts getSlotsEnabled). */
export async function updateSlotsEnabled(enabled: boolean): Promise<void> {
  await saveShopSettings({ slotsEnabled: enabled });
}

/** Saves the Christmas delivery and collection days (YYYY-MM-DD) staff picked on the Delivery slots page. */
export async function updateChristmasSlotDates(days: string[]): Promise<void> {
  await saveShopSettings({ christmasSlotDates: days });
}
