"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password");
        setSubmitting(false);
        return;
      }
      router.push("/admin/orders");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-border bg-white p-6 shadow-sm" style={{ borderRadius: "20px" }}>
        <h1 className="font-serif text-xl font-bold text-navy">Staff Login</h1>
        <p className="mt-1 text-base text-text-light">Steve Hatt Fishmongers, order capture</p>
        <div className="relative mt-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            className="w-full border border-border py-2 pl-3 pr-11 text-base"
            style={{ borderRadius: "10px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-light transition-colors hover:text-navy"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-2 text-base text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !password}
          className="mt-4 w-full bg-lobster px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "6px" }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
