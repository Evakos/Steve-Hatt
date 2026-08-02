import "server-only";
import { get } from "@vercel/edge-config";

/**
 * Whether Christmas pre-ordering is currently being offered site-wide — staff flip this via a
 * Vercel Edge Config item so it takes effect instantly, no redeploy (see /admin for how to flip
 * it until a write-capable admin button exists — see EDGE_CONFIG in .env.example). Defaults to
 * off if Edge Config isn't reachable (e.g. local dev without EDGE_CONFIG set) rather than
 * failing the page.
 */
export async function isChristmasShopActive(): Promise<boolean> {
  try {
    return (await get("christmasShopActive")) === true;
  } catch {
    return false;
  }
}
