"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  amount: number;
  onToken: (token: string) => void;
  disabled?: boolean;
}

// Mirrors the server-only CARDSTREAM_MOCK flag (see src/lib/env.ts) — needed client-side too,
// since real Hosted Payment Fields tokenization only happens in the browser.
const MOCK_MODE = process.env.NEXT_PUBLIC_CARDSTREAM_MOCK === "true";

const testButtonClass =
  "flex-1 min-w-[140px] border border-border bg-white px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Hosts Cardstream/Pay360's Hosted Payment Fields (iframe-based, tokenized card capture —
 * card data goes browser → Cardstream directly, never touching our server). The real SDK
 * integration is blocked on Pay360 developer portal access (see master plan, Phase D), so this
 * renders either a clearly-labelled mock (no real card fields — three buttons that request a
 * fixed test token) or a pending-integration notice, never a plain unhosted card form. That
 * distinction is the entire point of this project — see the Context section of the plan.
 */
export default function PaymentPanel({ amount, onToken, disabled }: Props) {
  const [tokenizing, setTokenizing] = useState(false);

  if (!MOCK_MODE) {
    return (
      <div className="flex items-start gap-3 border border-dashed border-lobster/40 bg-lobster/5 p-4" style={{ borderRadius: "5px" }}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lobster" />
        <p className="text-sm text-navy">
          Card payment isn&apos;t wired up yet, Cardstream/Pay360&apos;s Hosted Payment Fields integration needs
          developer portal access that wasn&apos;t available during this build. Set{" "}
          <code className="text-xs">NEXT_PUBLIC_CARDSTREAM_MOCK=true</code> to exercise this flow in development.
        </p>
      </div>
    );
  }

  const handleMockToken = (token: string) => {
    setTokenizing(true);
    setTimeout(() => {
      setTokenizing(false);
      onToken(token);
    }, 400);
  };

  return (
    <div className="border border-border bg-white p-4" style={{ borderRadius: "5px" }}>
      <div className="mb-3 flex items-center gap-1.5 text-xs text-text-light">
        <ShieldCheck className="h-3.5 w-3.5 text-teal" />
        Mock Hosted Payment Fields (dev only), no real card form, no card data collected here
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || tokenizing}
          onClick={() => handleMockToken("tok_mock_visa")}
          className={testButtonClass}
        >
          {tokenizing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </span>
          ) : (
            "Pay (approved)"
          )}
        </button>
        <button
          type="button"
          disabled={disabled || tokenizing}
          onClick={() => handleMockToken("tok_3ds")}
          className={testButtonClass}
        >
          Pay (3DS required)
        </button>
        <button
          type="button"
          disabled={disabled || tokenizing}
          onClick={() => handleMockToken("tok_decline")}
          className={testButtonClass}
        >
          Pay (declined)
        </button>
      </div>
    </div>
  );
}
