"use client";

import { Gift, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-context";

/** Lets the customer choose whether they're shopping for a standard order or a Christmas
 * pre-order — a cart can only ever be one or the other (see cart-context's setMode), so
 * switching with incompatible items already in the basket is blocked with an explanation rather
 * than silently dropping them. Only rendered when Christmas pre-ordering is active site-wide
 * (see src/lib/feature-flags.ts) — otherwise there's nothing to switch to. */
export default function CartModeSwitcher() {
  const { mode, setMode, items } = useCart();

  function handleSwitch(next: "standard" | "christmas") {
    if (next === mode) return;
    const ok = setMode(next);
    if (!ok) {
      alert(
        "Your basket has items that aren't available for Christmas pre-order. Remove them (or clear your basket) before switching."
      );
    }
  }

  return (
    <div className="border border-border bg-white p-4" style={{ borderRadius: "5px" }}>
      <p className="mb-3 text-sm font-medium text-navy">Shopping for:</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSwitch("standard")}
          className={`flex items-center gap-2 border p-3 text-left transition-colors ${
            mode === "standard" ? "border-navy bg-navy/5" : "border-border bg-white hover:border-navy/30"
          }`}
          style={{ borderRadius: "5px" }}
        >
          <Truck className={`h-4 w-4 shrink-0 ${mode === "standard" ? "text-navy" : "text-text-light"}`} />
          <span className={`text-sm font-medium ${mode === "standard" ? "text-navy" : "text-text-light"}`}>
            Standard Order
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("christmas")}
          className={`flex items-center gap-2 border p-3 text-left transition-colors ${
            mode === "christmas" ? "border-[#1a3a2a] bg-[#e8f5ed]" : "border-[#1a3a2a]/20 bg-white hover:border-[#1a3a2a]/40"
          }`}
          style={{ borderRadius: "5px" }}
        >
          <Gift className={`h-4 w-4 shrink-0 ${mode === "christmas" ? "text-[#1a3a2a]" : "text-text-light"}`} />
          <span className={`text-sm font-medium ${mode === "christmas" ? "text-[#1a3a2a]" : "text-text-light"}`}>
            Christmas Pre-Order
          </span>
        </button>
      </div>
      {items.length > 0 && (
        <p className="mt-3 text-xs text-text-light">
          {mode === "christmas" ? "Delivery or collection, 20th-24th December." : "Next-day delivery or collection."}
        </p>
      )}
    </div>
  );
}
