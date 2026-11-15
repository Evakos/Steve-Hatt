"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import type { CheckoutRequest } from "@/lib/checkout/schema";
import { HOSTED_MESSAGE_SOURCE, type HostedResult } from "@/lib/checkout/hosted-result";

interface Props {
  /** The checkout details to pay for, or null if they aren't complete. */
  buildRequest: () => Omit<CheckoutRequest, "payment"> | null;
  onResult: (result: HostedResult) => void;
}

type Phase = { name: "idle" } | { name: "starting" } | { name: "frame"; url: string } | { name: "error"; message: string };

const FIELD_LABELS: Record<string, string> = {
  email: "email address",
  firstName: "first name",
  lastName: "last name",
  phone: "phone number",
  line1: "address line 1",
  city: "town or city",
  postcode: "postcode",
};

/** Turns the server's validation problems into "Please check: first name, phone number." for the customer. */
function invalidDetailsMessage(issues: unknown): string {
  const labels = new Set<string>();
  if (Array.isArray(issues)) {
    for (const issue of issues) {
      const path = (issue as { path?: unknown })?.path;
      const last = Array.isArray(path) ? path[path.length - 1] : undefined;
      if (typeof last === "string" && FIELD_LABELS[last]) labels.add(FIELD_LABELS[last]);
    }
  }
  return labels.size > 0
    ? `Please check your details above: ${[...labels].join(", ")}.`
    : "Please complete your details above, then try again.";
}

const primaryButton =
  "bg-lobster px-5 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The card form, shown right on the checkout page but served entirely by Pay360 (in a frame), so card
 * details go from the customer's browser to Pay360 and never reach our server or WordPress. The
 * order is created and a Pay360 session opened by /api/checkout/session; when the customer finishes,
 * Pay360 sends the frame to /checkout/return, which reports the result back here.
 */
export default function HostedPaymentFrame({ buildRequest, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // The return page reports the outcome by postMessage. Only messages from our own site count.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; result?: HostedResult } | null;
      if (!data || data.source !== HOSTED_MESSAGE_SOURCE || !data.result) return;
      onResultRef.current(data.result);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function start() {
    if (phase.name === "starting") return;
    const request = buildRequest();
    if (!request) return;
    setPhase({ name: "starting" });
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "session" && typeof data.redirectUrl === "string") {
        setPhase({ name: "frame", url: data.redirectUrl });
        return;
      }
      if (res.status === 400 && data.status === "invalid") {
        setPhase({ name: "error", message: invalidDetailsMessage(data.issues) });
        return;
      }
      const friendly = (data.status === "slot_unavailable" || data.status === "closed" || data.status === "minimum_not_met") && typeof data.reason === "string";
      setPhase({ name: "error", message: friendly ? data.reason : "We couldn't start the card payment. Please try again." });
    } catch {
      setPhase({ name: "error", message: "Network error. Please try again." });
    }
  }

  if (phase.name === "frame") {
    return (
      <div className="border border-border bg-card p-3" style={{ borderRadius: "5px" }}>
        <iframe
          src={phase.url}
          title="Secure card payment"
          className="h-[560px] w-full border-0 bg-white"
          style={{ borderRadius: "3px" }}
        />
        <button type="button" onClick={() => setPhase({ name: "idle" })} className="mt-2 text-xs text-navy underline">
          Change my details
        </button>
      </div>
    );
  }

  if (phase.name === "starting") {
    return (
      <div className="flex flex-col items-center gap-3 border border-border bg-card p-8 text-center" style={{ borderRadius: "5px" }}>
        <Loader2 className="h-6 w-6 animate-spin text-navy" />
        <p className="text-sm text-navy">Opening the secure card form…</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-4" style={{ borderRadius: "5px" }}>
      <div className="mb-3 flex items-start gap-2 text-xs text-text-light">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
        <span>You&apos;ll enter your card on the next step, in a secure form run by our payment provider, Pay360.</span>
      </div>
      {phase.name === "error" && <p className="mb-3 text-sm text-lobster">{phase.message}</p>}
      <button type="button" onClick={start} className={`w-full ${primaryButton}`} style={{ borderRadius: "6px" }}>
        Continue to card details
      </button>
    </div>
  );
}
