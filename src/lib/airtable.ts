import "server-only";
import { getServerEnv } from "@/lib/env";

interface AirtableListResponse {
  records: { id: string; fields: Record<string, unknown> }[];
  offset?: string;
}

/** Airtable returns typed values (numbers, checkboxes, arrays); the sync expects the plain strings a sheet cell gives. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "";
  if (Array.isArray(value)) return value.map(cellToString).filter(Boolean).join(", ");
  if (typeof value === "object") return "";
  return String(value);
}

/**
 * Reads a whole Airtable table and returns it as row objects keyed by field name - the same shape
 * as readSheetAsRows, so the sync logic doesn't care which source it came from. Pages through the
 * 100-records-per-request limit.
 */
export async function readAirtableRows(tableName: string): Promise<Record<string, string>[]> {
  const env = getServerEnv();
  if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_PRODUCTS_BASE_ID) {
    throw new Error("Airtable sync isn't configured - set AIRTABLE_TOKEN and AIRTABLE_PRODUCTS_BASE_ID (see .env.example).");
  }

  const rows: Record<string, string>[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${env.AIRTABLE_PRODUCTS_BASE_ID}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` }, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Airtable API error (${res.status}) reading "${tableName}": ${text}`);
    }
    const page = (await res.json()) as AirtableListResponse;
    for (const record of page.records) {
      const row = Object.fromEntries(Object.entries(record.fields).map(([k, v]) => [k, cellToString(v)]));
      if (Object.values(row).some((v) => v !== "")) rows.push(row);
    }
    offset = page.offset;
  } while (offset);

  return rows;
}
