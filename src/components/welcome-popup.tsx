"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Gift, Truck, Store } from "lucide-react";

const SEEN_KEY = "steve-hatt-welcome-popup-seen";

export default function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {}
    const timer = setTimeout(() => {
      if (!cancelled) setOpen(true);
    }, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-white p-6 shadow-xl"
        style={{ borderRadius: "14px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 p-1.5 text-text-light hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center bg-lobster/10 rounded-xl">
            <Gift className="h-5 w-5 text-lobster" />
          </div>
          <h2 id="welcome-popup-title" className="font-serif text-xl font-bold text-navy">
            Welcome to our new site
          </h2>
        </div>

        <p className="mb-4 text-sm text-text-light">
          Christmas orders are now here — no separate website.
        </p>

        <div className="mb-4 p-3 bg-sand rounded-lg space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-teal shrink-0" />
            <span><strong>Delivery</strong> — Islington, £5</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-teal shrink-0" />
            <span><strong>Collect</strong> — 88 Essex Road, free</span>
          </div>
        </div>

        <p className="mb-4 text-xs text-text-light/70">
          Your account and history work exactly as before.
        </p>

        <Link
          href="/shop"
          onClick={close}
          className="block bg-lobster px-5 py-2.5 text-center text-sm font-medium text-white rounded-lg hover:bg-lobster/90 transition-colors"
        >
          Start Christmas order
        </Link>

        <button
          onClick={close}
          className="mt-2 block text-center text-xs text-text-light underline hover:text-navy transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}