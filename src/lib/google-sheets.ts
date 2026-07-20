import "server-only";
import { createSign } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}
let cachedToken: CachedToken | null = null;

/**
 * Exchanges the Google service account's key for a short-lived Sheets API access token, using a
 * hand-rolled JWT Bearer Grant (RFC 7523) instead of the `googleapis` SDK — same "sign it
 * ourselves with node:crypto" approach already used for staff session cookies, and avoids adding
 * a heavy dependency for what's effectively one HTTP round-trip.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const env = getServerEnv();
  const email = env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error(
      "Google Sheets sync isn't configured — set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY (see .env.example)."
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: email, scope: SHEETS_READONLY_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  // Env vars can't hold real newlines, so the key is stored with literal "\n" escapes.
  const key = privateKey.replace(/\\n/g, "\n");
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const jwt = `${unsigned}.${base64url(signer.sign(key))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google OAuth token request failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.accessToken;
}

/**
 * Reads a whole sheet tab and returns it as row objects keyed by the header row (row 1) — so
 * column order in the spreadsheet doesn't matter, only the header names do.
 */
export async function readSheetAsRows(sheetName: string): Promise<Record<string, string>[]> {
  const env = getServerEnv();
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Google Sheets sync isn't configured — set GOOGLE_SHEETS_SPREADSHEET_ID (see .env.example).");
  }

  const accessToken = await getAccessToken();
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Sheets API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const [header, ...rows] = data.values ?? [];
  if (!header) return [];

  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => Object.fromEntries(header.map((col, i) => [col, row[i] ?? ""])));
}
