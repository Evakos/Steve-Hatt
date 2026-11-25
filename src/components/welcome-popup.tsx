"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Gift, Truck, Store, Info } from "lucide-react";

const SEEN_KEY = "steve-hatt-welcome-popup-seen";

/**
 * Welcome popup for first-time visitors explaining the new unified site for Christmas orders.
 * Shows once per session. Targeted at customers who used to order Christmas from a separate site.
 */
export default function WelcomePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Check if they've seen it this session
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {}
    
    // Small delay so the page loads first
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
        className="relative w-full max-w-lg bg-white p-8 shadow-xl"
        style={{ borderRadius: "14px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 p-2 text-text-light hover:text-navy"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center bg-lobster/10" style={{ borderRadius: "12px" }}>
            <Gift className="h-6 w-6 text-lobster" />
          </div>
          <div>
            <h2 id="welcome-popup-title" className="font-serif text-2xl font-bold text-navy">
              Welcome to our new site
            </h2>
            <p className="text-sm text-text-light">We've redesigned everything</p>
          </div>
        </div>

        <div className="space-y-4 text-base leading-relaxed text-text-light">
          <p>
            <strong className="text-navy">Christmas orders are now on this site.</strong> No more separate website — everything is here.
          </p>
          <p>
            To order for Christmas, just <strong className="text-navy">add to your basket and choose "For Christmas" at checkout</strong>. You'll pick your delivery or collection day there.
          </p>

          <div className="bg-sand p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-teal shrink-0" />
              <span><strong>Delivery</strong> — local across Islington, £5</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-teal shrink-0" />
              <span><strong>Click & Collect</strong> — 88 Essex Road, free</span>
            </div>
          </div>

          <p className="text-sm text-text-light/80">
            <Info className="h-4 w-4 inline-block align-middle mr-1 text-lobster" />
            Your account, order history and saved details all work exactly as before.
          </p>
        </div>

        <Link
          href="/shop"
          onClick={close}
          className="mt-6 block bg-lobster px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-lobster/90"
          style={{ borderRadius: "6px" }}
        >
          Start your Christmas order
        </Link>

        <button
          onClick={close}
          className="mt-3 block text-center text-sm text-text-light underline hover:text-navy transition-colors"
        >
          No thanks, I'll look around first
        </button>
      </div>
    </div>
  );
}