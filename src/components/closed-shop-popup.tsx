"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const SEEN_KEY = "steve-hatt-closed-popup-seen";

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "2027-01-05" as "Tuesday 5th January". */
function reopenText(date: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const d = new Date(`${date}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" }).format(d);
  const month = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long" }).format(d);
  return `${weekday} ${ordinal(Number(m[3]))} ${month}`;
}

/**
 * On the home page while the shop is closed for orders (the Christmas break): a pop-up saying customers can still browse,
 * and when ordering reopens. Buying is switched off elsewhere (add to basket and checkout). Shown once per visit.
 */
export default function ClosedShopPopup() {
  const [open, setOpen] = useState(false);
  const [reopen, setReopen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ordersClosed?: boolean; reopenDate?: string; preview?: boolean } | null) => {
        if (cancelled || data?.ordersClosed !== true) return;
        setReopen(typeof data.reopenDate === "string" ? reopenText(data.reopenDate) : null);
        try {
          // A staff preview always shows it, even if it was closed earlier in this visit.
          if (data.preview !== true && sessionStorage.getItem(SEEN_KEY)) return;
        } catch {}
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
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
      aria-labelledby="closed-popup-title"
      onClick={close}
    >
      <div className="relative w-full max-w-md bg-white p-8 text-center shadow-xl" style={{ borderRadius: "14px" }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 p-2 text-text-light hover:text-navy">
          <X className="h-5 w-5" />
        </button>
        <h2 id="closed-popup-title" className="font-serif text-2xl font-bold text-navy">
          We&apos;re closed for orders
        </h2>
        <p className="mt-3 text-base leading-relaxed text-text-light">
          Browse our store, and we&apos;ll be open for orders again{" "}
          {reopen ? <strong className="font-semibold text-navy">on {reopen}</strong> : "soon"}.
        </p>
        <Link
          href="/shop"
          onClick={close}
          className="mt-6 inline-block bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          style={{ borderRadius: "6px" }}
        >
          Browse the store
        </Link>
      </div>
    </div>
  );
}
