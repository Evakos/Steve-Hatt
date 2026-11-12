import "server-only";
import { getServerEnv } from "@/lib/env";
import { isPaymentSandboxMode } from "@/lib/feature-flags";

/** Pay360's test host (MITE). Live is CARDSTREAM_API_BASE_URL, which should be https://api.pay360.com. */
export const PAY360_SANDBOX_URL = "https://api.mite.pay360.com";

export interface PaymentConfig {
  sandbox: boolean;
  baseUrl: string;
  username: string;
  password: string;
  installationId: string;
}

/**
 * Which Pay360 login and host to use right now, decided by the admin "Payment mode" switch
 * (Products page). Sandbox uses the CARDSTREAM_SANDBOX_* login against Pay360's test host; live
 * uses the CARDSTREAM_* login. Throws a plain-English error rather than quietly falling back, so a
 * missing login can never send test traffic to the live account or the other way round.
 * The real client uses this once it is built; the built-in mock (CARDSTREAM_MOCK) ignores it.
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  const env = getServerEnv();
  const sandbox = await isPaymentSandboxMode();

  if (sandbox) {
    const username = env.CARDSTREAM_SANDBOX_API_USERNAME;
    const password = env.CARDSTREAM_SANDBOX_API_PASSWORD;
    const installationId = env.CARDSTREAM_SANDBOX_INSTALLATION_ID;
    if (!username || !password || !installationId) {
      throw new Error(
        "Payment mode is Sandbox, but the sandbox login isn't set. Add CARDSTREAM_SANDBOX_API_USERNAME, CARDSTREAM_SANDBOX_API_PASSWORD and CARDSTREAM_SANDBOX_INSTALLATION_ID (see .env.example)."
      );
    }
    return { sandbox: true, baseUrl: PAY360_SANDBOX_URL, username, password, installationId };
  }

  if (/\bmite\./i.test(env.CARDSTREAM_API_BASE_URL)) {
    throw new Error(
      "Payment mode is Live, but CARDSTREAM_API_BASE_URL still points at Pay360's sandbox. Set it to https://api.pay360.com."
    );
  }
  return {
    sandbox: false,
    baseUrl: env.CARDSTREAM_API_BASE_URL,
    username: env.CARDSTREAM_API_USERNAME,
    password: env.CARDSTREAM_API_PASSWORD,
    installationId: env.CARDSTREAM_INSTALLATION_ID,
  };
}
