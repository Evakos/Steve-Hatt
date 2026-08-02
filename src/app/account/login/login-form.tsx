"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const expired = errorParam === "expired";
  const unavailable = errorParam === "unavailable";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      <div className="w-full max-w-sm border border-border bg-white p-6 text-center" style={{ borderRadius: "5px" }}>
        <h1 className="font-serif text-xl font-bold text-navy">Check your email</h1>
        <p className="mt-2 text-sm text-text-light">
          We&apos;ve sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
      <h1 className="font-serif text-xl font-bold text-navy">Sign in</h1>
      <p className="mt-1 text-sm text-text-light">
        Enter your email and we&apos;ll send you a sign-in link, no password needed. New here? This creates
        your account too.
      </p>
      {expired && (
        <p className="mt-3 text-sm text-red-600">That link has expired or is invalid, request a new one below.</p>
      )}
      {unavailable && (
        <p className="mt-3 text-sm text-red-600">
          That email can&apos;t be used for an account here, try a different email, or continue as a guest below.
        </p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoFocus
        required
        className="mt-4 w-full border border-border px-3 py-2 text-sm"
        style={{ borderRadius: "5px" }}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email}
        className="mt-4 w-full bg-lobster px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderRadius: "5px" }}
      >
        {submitting ? "Sending…" : "Send sign-in link"}
      </button>
      <p className="mt-4 text-center text-xs text-text-light">
        <Link href="/#shop" className="underline hover:text-navy">Continue as guest</Link>
      </p>
    </form>
  );
}
