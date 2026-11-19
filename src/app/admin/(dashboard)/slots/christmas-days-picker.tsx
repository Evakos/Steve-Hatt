"use client";

import { useEffect, useState } from "react";
import { DateCalendar, dayLabel } from "@/components/date-calendar";

interface Props {
  /** The Christmas days saved so far (YYYY-MM-DD). */
  initialDays: string[];
  /** The December the days are picked for. */
  year: number;
  /** Whether the Christmas switch is on, to warn when it is on with no days picked. */
  christmasOn: boolean;
  /** Called with the saved days after a successful save. */
  onSaved?: (days: string[]) => void;
}

/**
 * Where staff pick the Christmas delivery and collection days. None are picked for them. It shows as one
 * line with a "Choose days" button, and opens the calendar when asked (or when the page is opened with
 * #christmas-days, which the Products page links to).
 */
export default function ChristmasDaysPicker({ initialDays, year, christmasOn, onSaved }: Props) {
  const [days, setDays] = useState<string[]>(initialDays);
  const [saved, setSaved] = useState<string[]>(initialDays);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = days.join(",") !== saved.join(",");

  useEffect(() => {
    if (window.location.hash === "#christmas-days") setOpen(true);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/christmas-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(data.days);
      setDays(data.days);
      onSaved?.(data.days);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleOpen() {
    // Closing with unsaved picks drops them, so the line always shows what is live.
    if (open && dirty) setDays(saved);
    setOpen(!open);
  }

  return (
    <div id="christmas-days" className="mt-4 max-w-3xl scroll-mt-6 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-navy">Christmas delivery and collection days</p>
          <p className="mt-1 text-sm text-text-light">
            {saved.length > 0 ? `Picked: ${saved.map(dayLabel).join(", ")}` : "No days picked yet."}
          </p>
          {christmasOn && saved.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              The Christmas switch is on, but no days are saved, so customers won&apos;t see Christmas ordering.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggleOpen}
          className="shrink-0 border border-navy px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-white"
          style={{ borderRadius: "6px" }}
        >
          {open ? "Close" : "Choose days"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-text-light">
              Click the days customers can book for Christmas. Click a picked day again to remove it. Nothing is picked for
              you, and until some days are picked Christmas ordering can&apos;t be offered. Each picked day has the same
              delivery and collection slots as any other, which you can switch off below.
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <DateCalendar
                value=""
                values={days}
                min={`${year}-12-01`}
                max={`${year}-12-24`}
                onChange={(date) => setDays((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()))}
              />
              {days.length > 0 && (
                <button type="button" onClick={() => setDays([])} className="text-xs text-text-light underline">
                  Clear all days
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="bg-lobster px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "6px" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {dirty ? (
              <span className="text-sm text-amber-600">Unsaved changes.</span>
            ) : (
              <span className="text-sm text-teal">{saved.length > 0 ? "Saved, and live on the website now." : "Nothing saved yet."}</span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
