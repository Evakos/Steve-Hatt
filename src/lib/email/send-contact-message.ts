import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import { emailShell, emailHeading } from "./layout";

const FROM_ADDRESS = "orders@stevehattfishmongers.co.uk";

let cachedClient: Resend | null = null;
function resend() {
  if (!cachedClient) cachedClient = new Resend(getServerEnv().RESEND_API_KEY);
  return cachedClient;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/** Forwards a /contact form submission to staff (ADMIN_NOTIFICATION_EMAIL) — mirrors the live
 * site's own "we don't take orders via email, but reply to enquiries within 48 hours" wording.
 * Thrown, not swallowed: unlike order confirmations, there's no other record of this submission
 * if the email fails, so the caller needs to know and tell the customer to try again. */
export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { name, email, message } = input;
  const to = getServerEnv().ADMIN_NOTIFICATION_EMAIL;

  const html = emailShell(`
    ${emailHeading("New contact form message")}
    <p><strong>From:</strong> ${name} (${email})</p>
    <p style="white-space:pre-wrap;">${message}</p>
  `);

  await resend().emails.send({
    from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
    to,
    replyTo: email,
    subject: `Contact form message from ${name}`,
    html,
  });
}
