"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { sessionRequestSchema, type CheckoutRequest } from "@/lib/checkout/schema";
import { HOSTED_MESSAGE_SOURCE, type HostedResult } from "@/lib/checkout/hosted-result";

type Details = Omit<CheckoutRequest, "payment">;

interface Props {
  /** The checkout details to pay for, or null if they aren't complete. */
  buildRequest: () => Details | null;
  onResult: (result: HostedResult) => void;
}

type Phase =
  | { name: "waiting" }
  | { name: "starting" }
  | { name: "frame"; url: string }
  | { name: "error"; message: string };

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

/** Complete enough to open the card form: valid, a real-looking phone number, and an address for delivery. */
function readyToPay(request: Details | null): request is Details {
  if (!request || !sessionRequestSchema.safeParse(request).success) return false;
  if (request.customer.phone.replace(/\D/g, "").length < 10) return false;
  if (request.fulfilment.type === "delivery") {
    const address = request.customer.address;
    if (!address || !address.line1.trim() || !address.city.trim() || !address.postcode.trim()) return false;
  }
  return true;
}

const placeholderBox =
  "flex min-h-[9rem] flex-col items-center justify-center gap-2 border border-dashed border-border bg-card px-6 py-8 text-center";

/**
 * The card form, shown right on the checkout page but served entirely by Pay360 (in a frame), so card
 * details go from the customer's browser to Pay360 and never reach our server or WordPress. It opens by
 * itself as soon as the details above are complete (and reopens, replacing the earlier unpaid order, if
 * they change those details or the basket). /api/checkout/session creates the order and the Pay360
 * session; when the customer finishes, Pay360 sends the frame to /checkout/return, which reports back here.
 */
export default function HostedPaymentFrame({ buildRequest, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "waiting" });
  const request = buildRequest();
  const ready = readyToPay(request);
  // The details that matter, as text, so a change can be noticed. The unused card token is left out.
  const fingerprint = ready ? JSON.stringify(request, (key, value) => (key === "payment" ? undefined : value)) : "";

  // Wait for a pause in typing, so the card form isn't reopened on every keystroke.
  const [settled, setSettled] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(fingerprint), 800);
    return () => clearTimeout(timer);
  }, [fingerprint]);

  const onResultRef = useRef(onResult);
  const requestRef = useRef<Details | null>(request);
  useEffect(() => {
    onResultRef.current = onResult;
    requestRef.current = request;
  });

  // The order and card form currently open, so a change can replace them rather than pile up.
  const openRef = useRef<{ orderId: number; orderRef: string; fingerprint: string } | null>(null);
  const attempt = useRef(0);

  async function start(forFingerprint: string) {
    const details = requestRef.current;
    if (!details) return;
    const mine = ++attempt.current;
    setPhase({ name: "starting" });
    try {
      const open = openRef.current;
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, replaces: open ? { orderId: open.orderId, orderRef: open.orderRef } : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (mine !== attempt.current) return; // a newer change has taken over
      if (res.ok && data.status === "session" && typeof data.redirectUrl === "string") {
        openRef.current = { orderId: data.orderId, orderRef: data.orderRef, fingerprint: forFingerprint };
        setPhase({ name: "frame", url: data.redirectUrl });
        return;
      }
      if (res.status === 400 && data.status === "invalid") {
        setPhase({ name: "error", message: invalidDetailsMessage(data.issues) });
        return;
      }
      const friendly =
        (data.status === "slot_unavailable" || data.status === "closed" || data.status === "minimum_not_met") &&
        typeof data.reason === "string";
      setPhase({ name: "error", message: friendly ? data.reason : "We couldn't open the card form. Please try again." });
    } catch {
      if (mine === attempt.current) setPhase({ name: "error", message: "Network error. Please try again." });
    }
  }

  useEffect(() => {
    if (!settled) {
      attempt.current++; // cancel anything in flight
      setPhase({ name: "waiting" });
      return;
    }
    if (openRef.current?.fingerprint === settled) return; // already open for exactly these details
    void start(settled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

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

  if (phase.name === "frame") {
    return (
      <div className="border border-border bg-card p-3" style={{ borderRadius: "5px" }}>
        <iframe
          src={phase.url}
          title="Secure card payment"
          className="h-[560px] w-full border-0 bg-white"
          style={{ borderRadius: "3px" }}
        />
      </div>
    );
  }

  if (phase.name === "starting") {
    return (
      <div className={placeholderBox} style={{ borderRadius: "5px" }}>
        <Loader2 className="h-5 w-5 animate-spin text-navy" />
        <p className="text-sm text-navy">Opening the secure card form…</p>
      </div>
    );
  }

  if (phase.name === "error") {
    return (
      <div className={placeholderBox} style={{ borderRadius: "5px" }}>
        <p className="text-sm text-lobster">{phase.message}</p>
        <button
          type="button"
          onClick={() => void start(settled)}
          className="text-xs font-medium text-navy underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={placeholderBox} style={{ borderRadius: "5px" }}>
      <CreditCard className="h-6 w-6 text-text-light" />
      <p className="text-sm text-text-light">
        Your secure card form appears here as soon as your details above are complete.
      </p>
    </div>
  );
}
