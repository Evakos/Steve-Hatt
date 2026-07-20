import { NextResponse } from "next/server";
import { z } from "zod";
import { createMagicLinkToken } from "@/lib/customer-auth";
import { sendMagicLinkEmail } from "@/lib/email/send-magic-link";

const requestSchema = z.object({ email: z.email() });

// Matches the hardcoded domain already used elsewhere (e.g. send-order-confirmation.ts's
// /admin/orders link) rather than introducing a new env var for it.
const SITE_URL = "https://steve-hatt-demo.vercel.app";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const token = createMagicLinkToken(parsed.data.email);
  const verifyUrl = `${SITE_URL}/api/account/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendMagicLinkEmail(parsed.data.email, verifyUrl);
  } catch (err) {
    console.error("Failed to send magic link email", err);
    return NextResponse.json({ error: "Couldn't send the sign-in email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
