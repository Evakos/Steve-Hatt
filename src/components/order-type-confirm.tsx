"use client";

import { useEffect } from "react";
import { getUpcomingChristmasDates } from "@/lib/christmas-dates";
import { christmasFulfilmentPhrase, lastDaySentence } from "@/lib/christmas-fulfilment";

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

interface Props {
  /** The choice waiting to be confirmed, or null when nothing is. */
  target: "standard" | "christmas" | null;
  christmasDates: string[];
  /** Slots switched off in the admin, so the wording says collection only when delivery is off on every Christmas day. */
  disabledSlots?: string[];
  /** e.g. "16th December", or null when no last order day is set. */
  lastOrder: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * "Are you sure?" shown when someone switches between a standard and a Christmas order. The choice
 * changes both the prices and which days can be booked, so it is confirmed before it takes effect.
 */
export default function OrderTypeConfirm({ target, christmasDates, disabledSlots = [], lastOrder, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onCancel]);

  if (!target) return null;
  const isChristmas = target === "christmas";
  const fulfilment = christmasFulfilmentPhrase(christmasDates, disabledSlots);
  const days = getUpcomingChristmasDates(new Date(), christmasDates).map((d) => dayFormat.format(d));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-type-title"
      onClick={onCancel}
    >
      <div className="w-full max-w-md bg-white p-6 shadow-xl" style={{ borderRadius: "12px" }} onClick={(e) => e.stopPropagation()}>
        <h2 id="order-type-title" className="font-serif text-xl font-bold text-navy">
          {isChristmas ? "Is this order for Christmas?" : "Switch to a standard order?"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-light">
          {isChristmas ? (
            <>
              You have chosen a Christmas order. Christmas prices apply where they differ, and {fulfilment} will be on
              {days.length > 0 ? ` ${days.join(", ")}` : " one of the Christmas days"} only.
              {lastOrder ? ` ${lastDaySentence(lastOrder)}` : ""} Is that right?
            </>
          ) : (
            <>
              This switches you to a standard order: normal prices, and the next available delivery or collection day instead of
              the Christmas days. Is that right?
            </>
          )}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="border border-border px-5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-cream"
            style={{ borderRadius: "6px" }}
          >
            Go back
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            style={{ borderRadius: "6px" }}
          >
            {isChristmas ? "Yes, it's for Christmas" : "Yes, standard order"}
          </button>
        </div>
      </div>
    </div>
  );
}
