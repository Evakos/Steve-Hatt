"use client";

import { useEffect, useState } from "react";
import { hasUpcomingChristmasDates } from "./christmas-dates";

let cached: Promise<boolean> | null = null;

/** Christmas ordering on right now: the same rule the basket and checkout use. Fetched once per page
 * load and shared, so several price lines on one page make a single request. */
function loadChristmasActive(): Promise<boolean> {
  if (!cached) {
    cached = fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { active?: boolean; slotsEnabled?: boolean; christmasDates?: string[] } | null) =>
        (data?.active ?? false) && hasUpcomingChristmasDates(new Date(), data?.christmasDates ?? [])
      )
      .catch(() => {
        cached = null;
        return false;
      });
  }
  return cached;
}

export function useChristmasActive(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadChristmasActive().then((value) => {
      if (!cancelled) setActive(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return active;
}
