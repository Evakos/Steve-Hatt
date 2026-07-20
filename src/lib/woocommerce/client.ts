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

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    next: options.next,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WooCommerce API error ${res.status} for ${options.method ?? "GET"} ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}
