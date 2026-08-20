"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  onComplete: (threeDSResponse: unknown) => void;
}

/**
 * Real integration: render Cardstream's 3-D Secure 2 challenge iframe and listen for its
 * postMessage completion event here - exact contract unconfirmed pending Pay360 developer
 * docs (see master plan, Phase D). In mock mode the only challenge ever issued is synthetic
 * (see src/lib/cardstream/mock-client.ts), so this auto-resolves after a short delay.
 */
export default function ThreeDSChallenge({ onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete({ mock: true }), 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-3 border border-border bg-white p-10 text-center" style={{ borderRadius: "5px" }}>
      <Loader2 className="h-6 w-6 animate-spin text-navy" />
      <p className="text-sm text-navy">Verifying your card…</p>
      <p className="text-xs text-text-light">Please don&apos;t close this window.</p>
    </div>
  );
}
