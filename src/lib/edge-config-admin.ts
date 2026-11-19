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
        { operation: "upsert", key: "christmasUseDepositFlow", value: input.christmasUseDepositFlow },
        ...(input.ordersReopenDate !== undefined
          ? [{ operation: "upsert", key: "ordersReopenDate", value: input.ordersReopenDate }]
          : []),
        ...(input.lastOrderDate !== undefined
          ? [{ operation: "upsert", key: "lastOrderDate", value: input.lastOrderDate }]
          : []),
        ...(input.christmasOpenDate !== undefined
          ? [{ operation: "upsert", key: "christmasOpenDate", value: input.christmasOpenDate }]
          : []),
        ...(input.christmasSlotDates !== undefined
          ? [{ operation: "upsert", key: "christmasSlotDates", value: input.christmasSlotDates }]
          : []),
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Edge Config update failed (${res.status}): ${text}`);
  }
}

/** Saves the list of switched-off delivery/collection slots (see src/lib/slots.ts). */
export async function updateDisabledSlots(slots: string[]): Promise<void> {
  const env = getServerEnv();
  if (!env.VERCEL_API_TOKEN || !env.EDGE_CONFIG_ID) {
    throw new Error(
      "Slots can't be saved - VERCEL_API_TOKEN and EDGE_CONFIG_ID aren't configured (see .env.example)."
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
    body: JSON.stringify({ items: [{ operation: "upsert", key: "disabledSlots", value: slots }] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Edge Config update failed (${res.status}): ${text}`);
  }
}

/** Saves the admin "Payment mode" switch: true is Pay360 sandbox, false is live (see feature-flags.ts). */
export async function updatePaymentSandboxMode(sandbox: boolean): Promise<void> {
  const env = getServerEnv();
  if (!env.VERCEL_API_TOKEN || !env.EDGE_CONFIG_ID) {
    throw new Error(
      "Payment mode can't be saved - VERCEL_API_TOKEN and EDGE_CONFIG_ID aren't configured (see .env.example)."
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
    body: JSON.stringify({ items: [{ operation: "upsert", key: "paymentSandboxMode", value: sandbox }] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Edge Config update failed (${res.status}): ${text}`);
  }
}

/** Saves the master "customers choose a time slot" switch (see feature-flags.ts getSlotsEnabled). */
export async function updateSlotsEnabled(enabled: boolean): Promise<void> {
  const env = getServerEnv();
  if (!env.VERCEL_API_TOKEN || !env.EDGE_CONFIG_ID) {
    throw new Error(
      "The slots switch can't be saved - VERCEL_API_TOKEN and EDGE_CONFIG_ID aren't configured (see .env.example)."
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
    body: JSON.stringify({ items: [{ operation: "upsert", key: "slotsEnabled", value: enabled }] }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel Edge Config update failed (${res.status}): ${text}`);
  }
}
