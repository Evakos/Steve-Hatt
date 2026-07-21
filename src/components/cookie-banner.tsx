"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "steve-hatt-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 max-w-xs border border-border bg-white p-4 shadow-lg"
      style={{ borderRadius: "8px" }}
    >
      <div className="flex items-start gap-2.5">
        <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
        <div>
          <p className="text-xs leading-relaxed text-text-light">
            We use cookies to improve your experience.{" "}
            <Link href="/privacy-policy" className="text-navy underline hover:text-lobster">
              Learn more
            </Link>
          </p>
          <button
            onClick={dismiss}
            className="mt-2.5 bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy/90"
            style={{ borderRadius: "4px" }}
          >
            Got it
          </button>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-text-light/60 hover:text-navy">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
