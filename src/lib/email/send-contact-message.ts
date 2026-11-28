import { getNotificationEmails } from "@/lib/site-settings";
import "server-only";
import { sendEmail } from "./send";
import { emailShell, emailHeading } from "./layout";

const FROM_ADDRESS = "orders@stevehattfishmongers.co.uk";


export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/** Forwards a /contact form submission to staff (ADMIN_NOTIFICATION_EMAIL) - mirrors the live
 * site's own "we don't take orders via email, but reply to enquiries within 48 hours" wording.
 * Thrown, not swallowed: unlike order confirmations, there's no other record of this submission
 * if the email fails, so the caller needs to know and tell the customer to try again. */
export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  const { name, email, message } = input;
  const to = await getNotificationEmails();

  const html = await emailShell(`
    ${emailHeading("New contact form message")}
    <p><strong>From:</strong> ${name} (${email})</p>
    <p style="white-space:pre-wrap;">${message}</p>
  `, "staff");

  await sendEmail({
    from: `Steve Hatt Fishmongers <${FROM_ADDRESS}>`,
    to,
    replyTo: email,
    subject: `Contact form message from ${name}`,
    html,
  });
}
