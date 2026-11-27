import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email/send-contact-message";
import { saveContactMessage } from "@/lib/contact-store";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(1),
  marketingOptIn: z.boolean().optional(),
  // Honeypot field - if filled, it's likely a bot
  website: z.string().optional(),
  // Cloudflare Turnstile token
  turnstileToken: z.string().optional(),
});

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Skip verification if not configured
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field with a valid email address." }, { status: 400 });
  }

  // Honeypot: if website field is filled, silently drop (return success to not alert bot)
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ status: "sent" });
  }

  // Verify Turnstile
  const turnstileValid = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileValid) {
    return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 400 });
  }

  try {
    await sendContactMessage(parsed.data);
  } catch (err) {
    console.error("Failed to send contact form message", err);
    return NextResponse.json({ error: "Something went wrong sending your message. Please try again or call the shop." }, { status: 500 });
  }

  await saveContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    marketingOptIn: parsed.data.marketingOptIn ?? false,
  });

  return NextResponse.json({ status: "sent" });
}
