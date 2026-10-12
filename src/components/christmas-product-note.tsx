"use client";

import { useEffect, useState } from "react";
import { getUpcomingChristmasDates } from "@/lib/christmas-dates";

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : { active: false }))
      .then((data) => {
        if (!cancelled) setActive(data.active === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!active) return null;

  if (excluded) {
    return (
      <div className="mt-4 border border-border bg-white px-4 py-3 text-sm text-text-light" style={{ borderRadius: "12px" }}>
        <p>This product is not available for Christmas pre-order. You can still order it for a standard delivery or collection date.</p>
      </div>
    );
  }

  const dates = getUpcomingChristmasDates();

  return (
    <div
      className="mt-4 border border-[#1a3a2a]/15 bg-[#e8f5ed] p-5 shadow-sm"
      style={{ borderRadius: "14px" }}
    >
      <p className="font-serif text-lg font-semibold leading-tight text-[#1a3a2a]">Available for Christmas pre-order</p>
      <p className="mt-1 text-sm leading-relaxed text-[#1a3a2a]/80">
        Reserve it now for the festive table, then choose your delivery or collection day at checkout.
      </p>
      {dates.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Christmas delivery and collection dates">
          {dates.map((d) => (
            <li
              key={d.toISOString()}
              className="bg-white px-3 py-1 text-xs font-medium text-[#1a3a2a] shadow-sm"
              style={{ borderRadius: "999px" }}
            >
              {dateFormat.format(d)}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-[#1a3a2a]/60">The shop is closed on Sunday and Monday.</p>
    </div>
  );
}
