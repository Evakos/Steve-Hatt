"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
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
      <div className="border border-border bg-white p-6 text-center" style={{ borderRadius: "5px" }}>
        <h3 className="font-serif text-lg font-bold text-navy">Message sent</h3>
        <p className="mt-2 text-sm text-text-light">
          Thanks, {name} — we aim to respond within 48 hours. Please don&apos;t email us to place an order — order
          online or call the shop instead.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
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
      </div>
      {error && <p className="mt-3 text-sm text-lobster">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full bg-lobster px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderRadius: "5px" }}
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
