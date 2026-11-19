import "server-only";
import { getServerEnv } from "@/lib/env";

interface WooFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
  /** Passed straight through to Next's extended fetch() for ISR-style caching. Omit for always-fresh requests. */
  next?: NextFetchRequestConfig;
}

/** Thin server-only fetch wrapper over the WooCommerce REST API (wc/v3). Never import this from a "use client" file. */
export async function wooFetch<T>(path: string, options: WooFetchOptions = {}): Promise<T> {
  const env = getServerEnv();
  const url = new URL(`/wp-json/wc/v3/${path.replace(/^\//, "")}`, env.WOOCOMMERCE_URL);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const auth = Buffer.from(`${env.WOOCOMMERCE_CONSUMER_KEY}:${env.WOOCOMMERCE_CONSUMER_SECRET}`).toString("base64");

  const request = () =>
    fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      next: options.next,
    });

  let res = await request();
  // WordPress answers 500/502/503/504 for a few moments while it updates itself or its database is busy ("Briefly
  // unavailable for scheduled maintenance", "Error establishing a database connection"). Reads are safe to repeat, so wait and try again rather than failing a build or a page.
  // Writes are never repeated.
  if ((options.method ?? "GET") === "GET") {
    for (const waitMs of [1500, 4000, 8000]) {
      if (![500, 502, 503, 504].includes(res.status)) break;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      res = await request();
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WooCommerce API error ${res.status} for ${options.method ?? "GET"} ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}
