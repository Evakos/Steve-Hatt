import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/email/send-contact-message";
import { saveContactMessage } from "@/lib/contact-store";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(1),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field with a valid email address." }, { status: 400 });
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
