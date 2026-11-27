"use client";

import { useState, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      getResponse: (widgetId: string) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  function handleTurnstileCallback(token: string) {
    setTurnstileToken(token);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, marketingOptIn, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-white p-6 text-center" style={{ borderRadius: "5px" }}>
        <h3 className="font-serif text-lg font-bold text-navy">Message sent</h3>
        <p className="mt-2 text-sm text-text-light">
          Thanks, {name}, we aim to respond within 48 hours. Please don&apos;t email us to place an order, order
          online or call the shop instead.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6" style={{ borderRadius: "5px" }}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-navy"
            style={{ borderRadius: "5px" }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-navy"
            style={{ borderRadius: "5px" }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-navy"
            style={{ borderRadius: "5px" }}
          />
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="marketing-opt-in"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-1 h-4 w-4 border-border text-lobster rounded focus:ring-lobster"
          />
          <label htmlFor="marketing-opt-in" className="text-sm text-text-light">
            I&apos;m happy to receive occasional updates about products and offers from Steve Hatt Fishmongers.
          </label>
        </div>
        {/* Cloudflare Turnstile */}
        <div
          ref={turnstileRef}
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="light"
          data-callback={handleTurnstileCallback}
        />
        {/* Honeypot field - hidden from humans, filled by bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none", opacity: 0, height: 0, width: 0, position: "absolute", left: -9999 }}
          aria-hidden="true"
        />
      </div>
      {error && <p className="mt-3 text-sm text-lobster">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full bg-lobster px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderRadius: "6px" }}
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
