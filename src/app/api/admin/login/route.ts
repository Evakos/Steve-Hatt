import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createSessionCookieValue, STAFF_COOKIE_NAME, STAFF_SESSION_TTL_MS } from "@/lib/staff-auth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));

  // Simple constant-time-ish comparison isn't critical here (single shared password, not a
  // per-user credential an attacker could target for account takeover), but there's no harm
  // in just doing a direct compare since STAFF_PASSWORD isn't a secret derived from user data.
  if (typeof password !== "string" || password !== getServerEnv().STAFF_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_MS / 1000,
  });
  return response;
}
