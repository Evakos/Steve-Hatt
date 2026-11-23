import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { isTestOrderMode } from "@/lib/feature-flags";

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
  // Optional shop-wide Reply-To (REPLY_TO_EMAIL), so customer replies reach a mailbox someone reads.
  const replyTo = getServerEnv().REPLY_TO_EMAIL;
  const { error } = await resend().emails.send(replyTo && !payload.replyTo ? { ...payload, replyTo } : payload);
  if (error) {
    throw new Error(`Resend rejected the email (${error.name}): ${error.message}`);
  }
}

const TEST_BANNER =
  '<div style="background:#f27052;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-align:center;padding:12px 16px">TEST ORDER. This is a test, nothing will be prepared or sent.</div>';

/** Sends an order email, marked as a TEST ("[TEST]" in the subject and a banner on top) while test mode is on. */
export async function sendOrderEmail(payload: EmailPayload): Promise<void> {
  if (!(await isTestOrderMode())) return sendEmail(payload);
  const p = payload as { subject: string; html?: string };
  const html =
    typeof p.html === "string" ? (/<body[^>]*>/i.test(p.html) ? p.html.replace(/(<body[^>]*>)/i, `$1${TEST_BANNER}`) : TEST_BANNER + p.html) : p.html;
  return sendEmail({ ...payload, subject: `[TEST] ${p.subject}`, ...(html !== undefined ? { html } : {}) } as EmailPayload);
}
