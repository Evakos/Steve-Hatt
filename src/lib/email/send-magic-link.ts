import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

const FROM_ADDRESS = "orders@stevehattfishmongers.co.uk";

let cachedClient: Resend | null = null;
function resend() {
  if (!cachedClient) cachedClient = new Resend(getServerEnv().RESEND_API_KEY);
  return cachedClient;
}

/**
 * The only email in the passwordless sign-in flow (see customer-auth.ts) — there's no separate
 * "welcome" or "verify your address" email, since clicking this link both proves the address and
 * completes sign-in/sign-up in one step. Unlike the order emails, a failure here **is** surfaced
 * to the caller (thrown, not swallowed) — silently failing would leave someone stuck with a
 * "check your email" screen and no way to get in.
 */
export async function sendMagicLinkEmail(to: string, verifyUrl: string): Promise<void> {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a2b3c;">
      <h1 style="font-size:20px;">Sign in to Steve Hatt Fishmongers</h1>
      <p>Click the button below to sign in. This link works once and expires in 15 minutes.</p>
      <p style="margin:24px 0;">
        <a href="${verifyUrl}" style="background:#d94f3d;color:#fff;padding:12px 24px;border-radius:5px;text-decoration:none;font-weight:bold;display:inline-block;">
          Sign in
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await resend().emails.send({
    from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
    to,
    subject: "Sign in to Steve Hatt Fishmongers",
    html,
  });
}
