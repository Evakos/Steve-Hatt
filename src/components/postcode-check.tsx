"use client";

import { useState } from "react";
import { MapPin, Truck, Store, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { DELIVERY_ZONES, normalisePostcode, extractOutcode } from "@/lib/delivery-zones";

type CheckState = "idle" | "checking" | "delivers" | "collect-only" | "invalid";

export default function PostcodeCheck() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<CheckState>("idle");
  const [outcode, setOutcode] = useState("");

  function handleCheck() {
    const normalised = normalisePostcode(input);
    const code = extractOutcode(normalised);

    if (!code || normalised.length < 3) {
      setState("invalid");
      return;
    }

    setOutcode(code);
    setState("checking");

    // Simulate a brief check
    setTimeout(() => {
      const delivers = DELIVERY_ZONES.some((zone) => code.startsWith(zone));
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
          style={{ borderRadius: "3px" }}
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
        </div>
      )}

      {state === "collect-only" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-warm">
            <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              We don't currently deliver to <strong>{outcode}</strong>, but you can still order online for <strong>click & collect</strong> from our Essex Road shop.
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-text-light">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>88 Essex Road, Islington, London N1 8LU</span>
          </div>
        </div>
      )}
    </div>
  );
}
