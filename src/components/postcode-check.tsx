"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Truck, Store, CheckCircle, XCircle, Loader2, Mail, UserPlus, X } from "lucide-react";
import { normalisePostcode, extractOutcode, isInDeliveryZone, formatFullPostcode } from "@/lib/delivery-zones";

type SendState = "idle" | "sending" | "sent" | "error";

/**
 * A one-line link under a delivery result that opens a small pop-up, so the hero never grows. In the
 * pop-up the visitor enters an email and the existing magic-link sign-in does the rest (the first
 * click creates the account). The postcode they just checked travels in the link and is saved to
 * the new account, so checkout starts filled in.
 */
function AccountPrompt({ postcode }: { postcode: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const saved = formatFullPostcode(postcode);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send() {
    setState("sending");
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), postcode }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-lobster underline-offset-2 hover:underline"
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        Save this postcode for faster checkout
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-prompt-title"
            className="relative w-full max-w-sm bg-white p-6 shadow-2xl"
            style={{ borderRadius: "16px" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-text-light transition-colors hover:text-navy"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {state === "sent" ? (
              <div className="py-2 text-center">
                <p id="account-prompt-title" className="font-serif text-xl font-semibold text-navy">Check your inbox</p>
                <p className="mt-2 text-sm leading-relaxed text-text-light">
                  We have sent a sign-in link to <strong className="text-navy">{email.trim()}</strong>. Click it and
                  your account is ready{saved ? `, with ${saved} saved` : ""}.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-5 bg-lobster px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e2573b]"
                  style={{ borderRadius: "6px" }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <p id="account-prompt-title" className="font-serif text-xl font-semibold text-navy">Save time at checkout</p>
                <p className="mt-2 text-sm leading-relaxed text-text-light">
                  Enter your email and we will send a sign-in link. We will remember your postcode
                  {saved ? ` (${saved})` : ""}, your details and your orders. No password needed.
                </p>
                <div className="relative mt-4">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" aria-hidden />
                  <input
                    ref={inputRef}
                    type="email"
                    required
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === "error") setState("idle");
                    }}
                    className="w-full border border-border bg-white py-3 pl-9 pr-3 text-sm text-navy outline-none placeholder:text-text-light focus:border-navy"
                    style={{ borderRadius: "6px" }}
                  />
                </div>
                {state === "error" && (
                  <p className="mt-2 text-xs text-lobster">That did not work. Please check the email address and try again.</p>
                )}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="mt-4 flex w-full items-center justify-center bg-lobster px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#e2573b] disabled:cursor-wait disabled:opacity-70"
                  style={{ borderRadius: "6px" }}
                >
                  {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send sign-in link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

type CheckState = "idle" | "checking" | "delivers" | "collect-only" | "invalid";

export default function PostcodeCheck() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<CheckState>("idle");
  const [outcode, setOutcode] = useState("");
  // null while we find out; guests get a 401 from /api/account/me. Signed-in customers already have an
  // account, so they are not offered one.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/me")
      .then((res) => {
        if (!cancelled) setSignedIn(res.ok);
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCheck() {
    const normalised = normalisePostcode(input);
    const code = extractOutcode(normalised);

    // "N1 8" would read as the real outward code N18, so a postcode typed with a space must be complete.
    const halfTyped = /\s/.test(input.trim()) && !formatFullPostcode(input);
    if (!code || normalised.length < 3 || halfTyped) {
      setState("invalid");
      return;
    }

    setOutcode(code);
    setState("checking");

    // Simulate a brief check
    setTimeout(() => {
      const delivers = isInDeliveryZone(code);
      setState(delivers ? "delivers" : "collect-only");
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCheck();
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
          <input
            type="text"
            placeholder="Enter postcode"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (state !== "idle") setState("idle");
            }}
            onKeyDown={handleKeyDown}
            className="w-full border border-border bg-white py-3 pl-9 pr-4 text-sm text-navy outline-none placeholder:text-text-light focus:border-navy"
            style={{ borderRadius: "3px" }}
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={state === "checking"}
          className="bg-teal px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:cursor-wait disabled:opacity-70"
          style={{ borderRadius: "6px" }}
        >
          {state === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Check"
          )}
        </button>
      </div>

      {/* Result */}
      {state === "invalid" && (
        <div className="mt-3 flex items-start gap-2 text-xs text-lobster">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Please enter a valid UK postcode (e.g. N1 8LU)</span>
        </div>
      )}

      {state === "delivers" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-teal">
            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Great news!</strong> We deliver to <strong>{outcode}</strong>, minimum order £20, £5.00 delivery.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-text-light">
            <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Click & collect also available from 88 Essex Road.</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-text-light">
            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Order by 6pm for next-day delivery.</span>
          </div>
          {signedIn === false && <AccountPrompt postcode={input} />}
        </div>
      )}

      {state === "collect-only" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-warm">
            <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              We don&apos;t currently deliver to <strong>{outcode}</strong>, but you can still order online for <strong>click & collect</strong> from our Essex Road shop.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-text-light">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>88 Essex Road, Islington, London N1 8LU</span>
          </div>
          {signedIn === false && <AccountPrompt postcode={input} />}
        </div>
      )}
    </div>
  );
}
