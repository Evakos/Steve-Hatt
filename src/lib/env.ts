import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  WOOCOMMERCE_URL: z.url(),
  WOOCOMMERCE_CONSUMER_KEY: z.string().min(1),
  WOOCOMMERCE_CONSUMER_SECRET: z.string().min(1),
  CARDSTREAM_API_BASE_URL: z.url(),
  CARDSTREAM_API_USERNAME: z.string().min(1),
  CARDSTREAM_API_PASSWORD: z.string().min(1),
  CARDSTREAM_INSTALLATION_ID: z.string().min(1),
  CARDSTREAM_WEBHOOK_SECRET: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  CARDSTREAM_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  RESEND_API_KEY: z.string().min(1),
  // One or more comma-separated staff addresses — every new-order alert, pre-order auth
  // failure and contact-form submission is sent to all of them (Resend's `to` accepts an array).
  ADMIN_NOTIFICATION_EMAIL: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean)
    )
    .refine(
      (emails) => emails.length > 0 && emails.every((email) => z.email().safeParse(email).success),
      { message: "must be one or more comma-separated email addresses" }
    ),
  STAFF_PASSWORD: z.string().min(1),
  STAFF_SESSION_SECRET: z.string().min(1),
  CUSTOMER_SESSION_SECRET: z.string().min(1),
  // Optional — /admin/products (sheet → site sync) checks for these itself and returns a clear
  // error if absent, rather than these being required for the whole app to boot.
  GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: z.string().min(1).optional(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().min(1).optional(),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1).optional(),
});

let cached: z.infer<typeof serverEnvSchema> | null = null;

/** Validates required server-only env vars on first access; throws with a clear message if misconfigured. */
export function getServerEnv() {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid/missing environment variables:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}\n\nSee .env.example for the full list.`
    );
  }
  cached = parsed.data;
  return cached;
}
