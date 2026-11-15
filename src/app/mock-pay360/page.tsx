import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test payment page", robots: { index: false, follow: false } };

/**
 * Stand-in for Pay360's payment page while the built-in test payments are on (CARDSTREAM_MOCK). It is
 * shown in the checkout's card frame, collects no card details, and links back to the return page
 * with the outcome you pick. Does not exist once real payments are switched on.
 */
export default async function MockPay360Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!getServerEnv().CARDSTREAM_MOCK) notFound();

  const params = await searchParams;
  const back = typeof params.return === "string" ? params.return : "";
  const amount = typeof params.amount === "string" ? params.amount : "0.00";
  // Only ever link back into our own return page.
  if (!back.startsWith("/checkout/return?")) notFound();

  const target = (outcome: string) => `${back}&outcome=${outcome}&amount=${encodeURIComponent(amount)}`;
  const button = "block w-full border border-border bg-white px-4 py-2.5 text-center text-sm font-medium text-navy hover:border-navy";

  return (
    <main className="flex flex-1 items-center justify-center bg-white px-6 py-8">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs tracking-widest text-text-light uppercase">Test payment page</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-navy">Pay £{amount}</h1>
        <p className="mt-2 text-sm text-text-light">
          This stands in for Pay360&apos;s secure card page. No card is needed and nothing is charged.
        </p>
        <div className="mt-5 space-y-2">
          <Link href={target("paid")} prefetch={false} className={button}>
            Pay (approved)
          </Link>
          <Link href={target("declined")} prefetch={false} className={button}>
            Pay (declined)
          </Link>
          <Link href={target("cancelled")} prefetch={false} className="block text-xs text-text-light underline">
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}
