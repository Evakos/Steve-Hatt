import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

let cachedClient: Resend | null = null;
function resend() {
  if (!cachedClient) cachedClient = new Resend(getServerEnv().RESEND_API_KEY);
  return cachedClient;
}

type EmailPayload = Parameters<Resend["emails"]["send"]>[0];

/**
 * Sends one email and throws if Resend rejects it. The Resend SDK *returns* API errors (invalid
 * key, unverified domain, suppressed address) instead of throwing them, so a bare `emails.send`
 * silently swallows every failure - callers' try/catch blocks never fire. This surfaces them.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { error } = await resend().emails.send(payload);
  if (error) {
    throw new Error(`Resend rejected the email (${error.name}): ${error.message}`);
  }
}
