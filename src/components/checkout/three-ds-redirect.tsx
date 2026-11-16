"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { BankRedirect } from "@/lib/checkout/three-ds-redirect";

/** Sends the shopper to their bank to confirm the payment: posts the form as soon as it appears. */
export default function ThreeDSRedirect({ redirect }: { redirect: BankRedirect }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 border border-border bg-card p-10 text-center" style={{ borderRadius: "5px" }}>
      <Loader2 className="h-6 w-6 animate-spin text-navy" />
      <p className="text-sm text-navy">Taking you to your bank to confirm the payment…</p>
      <form ref={formRef} action={redirect.url} method="POST">
        {Object.entries(redirect.fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <noscript>
          <button type="submit">Continue to your bank</button>
        </noscript>
      </form>
    </div>
  );
}
