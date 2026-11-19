"use client";

import { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { getUpcomingChristmasDates } from "@/lib/christmas-dates";
import { LAST_ORDER_LABEL } from "@/lib/ordering-window";

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/**
 * The Christmas note on a product page. It shows only while Christmas ordering is switched on
 * (the same flag the rest of the shop uses), and only the right message for the product: open for
 * pre-order with the bookable dates, or a plain "not available for Christmas" for excluded items.
 * Product pages are statically generated, so this asks the flag in the browser to react the moment
 * the switch is flipped, with no rebuild.
 */
export default function ChristmasProductNote({ excluded }: { excluded: boolean }) {
  const [active, setActive] = useState(false);
  const [lastOrder, setLastOrder] = useState(LAST_ORDER_LABEL);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : { active: false }))
      .then((data) => {
        if (cancelled) return;
        setActive(data.active === true);
        if (typeof data.lastOrderLabel === "string") setLastOrder(data.lastOrderLabel);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!active) return null;

  if (excluded) {
    return (
      <div className="mt-4 border border-border bg-card px-4 py-3 text-sm text-text-light" style={{ borderRadius: "12px" }}>
        <p>This product is not available for Christmas pre-order. You can still order it for a standard delivery or collection date.</p>
      </div>
    );
  }

  const dates = getUpcomingChristmasDates();

  return (
    <div
      className="relative mt-4 overflow-hidden border border-[#1a3a2a]/10 bg-[#e8f5ed] p-5"
      style={{ borderRadius: "8px" }}
    >
      <Snowflake className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 text-[#1a3a2a]/5" aria-hidden />
      <div className="relative">
        <p className="font-serif text-lg font-semibold leading-tight text-[#1a3a2a]">Available for Christmas pre-order</p>
        <p className="mt-1 text-sm leading-relaxed text-[#1a3a2a]/80">
          Reserve it now for the festive table, then choose your delivery or collection day at checkout. Christmas
          pre-orders close on {lastOrder}.
        </p>
      </div>
      {dates.length > 0 && (
        <div className="relative mt-4 border-t border-[#1a3a2a]/10 pt-4">
          <p className="text-sm font-medium text-[#1a3a2a]/70">Xmas delivery or collection dates are:</p>
          <p className="mt-1 font-serif text-lg font-semibold text-[#1a3a2a]">{dates.map((d) => dateFormat.format(d)).join(" · ")}</p>
        </div>
      )}
      <p className="relative mt-3 text-xs text-[#1a3a2a]/60">The shop is closed on Sunday and Monday.</p>
    </div>
  );
}
