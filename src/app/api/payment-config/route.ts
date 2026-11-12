import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { isPaymentSandboxMode } from "@/lib/feature-flags";

/** What the checkout page needs to know about payments, and nothing secret: whether the built-in
 * mock is on, whether Pay360 is in sandbox mode, and the installation ID for the active mode (the
 * installation ID is public by design, it goes in the browser for Pay360's card fields). */
export async function GET() {
  const env = getServerEnv();
  const sandbox = await isPaymentSandboxMode();
  const installationId = sandbox ? env.CARDSTREAM_SANDBOX_INSTALLATION_ID : env.CARDSTREAM_INSTALLATION_ID;
  return NextResponse.json(
    { mock: env.CARDSTREAM_MOCK, sandbox, installationId: installationId ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
