import "server-only";
import { get } from "@vercel/edge-config";
import { getServerEnv } from "@/lib/env";

/** Cache tag for the settings feed, so a change can be picked up straight away. */
export const SHOP_SETTINGS_TAG = "shop-settings";

type Settings = Record<string, unknown>;

/**
 * The shop's settings live in WordPress (Settings > Shop settings in wp-admin) and are read from
 * /wp-json/steve-hatt/v1/settings. Vercel's own settings store is kept as a mirror, used only when
 * WordPress has no saved settings yet or can't be reached, so a blip on the backend never changes what
 * the shop is doing.
 */
async function fetchFromWordPress(): Promise<Settings | null> {
  try {
    const res = await fetch(`${getServerEnv().WOOCOMMERCE_URL}/wp-json/steve-hatt/v1/settings`, {
      next: { revalidate: 30, tags: [SHOP_SETTINGS_TAG] },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { configured?: boolean; settings?: Settings };
    return data.configured === true && data.settings ? data.settings : null;
  } catch {
    return null;
  }
}

/** One setting. Never throws: WordPress first, then the mirror, else undefined (callers apply their own default). */
export async function readSetting(key: string): Promise<unknown> {
  const fromWordPress = await fetchFromWordPress();
  if (fromWordPress && key in fromWordPress) return fromWordPress[key];
  try {
    return await get(key);
  } catch {
    return undefined;
  }
}
