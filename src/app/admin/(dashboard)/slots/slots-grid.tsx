"use client";

import { useState } from "react";
import { Store, Truck } from "lucide-react";
import { SLOT_WINDOWS, type SlotWindowId } from "@/lib/slots";

interface DateRow {
  /** YYYY-MM-DD */
  key: string;
  label: string;
  isChristmas: boolean;
}

interface Props {
  dates: DateRow[];
  initialDisabled: string[];
}

const COLUMNS = "grid-cols-[minmax(9.5rem,1.5fr)_repeat(3,minmax(5.5rem,1fr))]";

export default function SlotsGrid({ dates, initialDisabled }: Props) {
  const [disabled, setDisabled] = useState<string[]>(initialDisabled);
  const [saved, setSaved] = useState<string[]>(initialDisabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyFor = (dateKey: string, id: SlotWindowId) => `${dateKey}|${id}`;
  const isOn = (dateKey: string, id: SlotWindowId) => !disabled.includes(keyFor(dateKey, id));
  const dirty = [...disabled].sort().join(",") !== [...saved].sort().join(",");
  const shownKeys = new Set(dates.flatMap((d) => SLOT_WINDOWS.map((w) => keyFor(d.key, w.id))));
  const offCount = disabled.filter((k) => shownKeys.has(k)).length;

  /** Switch a set of slots on or off in one go. */
  function setMany(keys: string[], on: boolean) {
    setDisabled((prev) => {
      const without = prev.filter((k) => !keys.includes(k));
      return on ? without : [...without, ...keys];
    });
  }

  const dayKeys = (d: DateRow) => SLOT_WINDOWS.map((w) => keyFor(d.key, w.id));
  const windowKeys = (id: SlotWindowId) => dates.map((d) => keyFor(d.key, id));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabledSlots: disabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setDisabled(data.disabledSlots);
      setSaved(data.disabledSlots);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
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
          <span className="text-sm text-amber-600">Unsaved changes. Customers won&apos;t see them until you save.</span>
        ) : (
          <span className="text-sm text-teal">Saved, and live on the website now</span>
        )}
        <span className="ml-auto text-sm text-text-light">
          {offCount === 0 ? "All slots are on" : `${offCount} slot${offCount === 1 ? "" : "s"} switched off`}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto border border-border bg-white shadow-sm" style={{ borderRadius: "16px" }}>
        <div className="min-w-[34rem]">
          {/* Column headings, each with an all-dates switch */}
          <div className={`grid ${COLUMNS} items-end gap-2 border-b border-border bg-cream px-4 py-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-light">Day</p>
            {SLOT_WINDOWS.map((w) => {
              const allOn = windowKeys(w.id).every((k) => !disabled.includes(k));
              return (
                <div key={w.id}>
                  <p className="flex items-center gap-1 text-xs font-semibold text-navy">
                    {w.type === "delivery" ? <Truck className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                    {w.type === "delivery" ? `Delivery, ${w.name.toLowerCase()}` : "Collection"}
                  </p>
                  <p className="text-xs text-text-light">{w.time}</p>
                  <button
                    type="button"
                    onClick={() => setMany(windowKeys(w.id), !allOn)}
                    className="mt-0.5 text-xs text-text-light underline hover:text-navy"
                  >
                    {allOn ? "Switch all off" : "Switch all on"}
                  </button>
                </div>
              );
            })}
          </div>

          {dates.length === 0 && <p className="px-4 py-6 text-sm text-text-light">There are no bookable days right now.</p>}

          {dates.map((d) => {
            const dayAllOn = dayKeys(d).every((k) => !disabled.includes(k));
            return (
              <div
                key={d.key}
                className={`grid ${COLUMNS} items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0 ${
                  d.isChristmas ? "bg-[#e8f5ed]/50" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-navy">{d.label}</p>
                  <div className="flex items-center gap-2">
                    {d.isChristmas && <span className="text-xs font-medium text-[#1a3a2a]">🎄 Christmas</span>}
                    <button
                      type="button"
                      onClick={() => setMany(dayKeys(d), !dayAllOn)}
                      className="text-xs text-text-light underline hover:text-navy"
                    >
                      {dayAllOn ? "Switch day off" : "Switch day on"}
                    </button>
                  </div>
                </div>
                {SLOT_WINDOWS.map((w) => {
                  const on = isOn(d.key, w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${d.label}, ${w.name} ${w.time}: ${on ? "on" : "off"}`}
                      onClick={() => setMany([keyFor(d.key, w.id)], !on)}
                      className={`w-full px-2 py-2 text-xs font-semibold transition-colors ${
                        on ? "bg-teal text-white hover:bg-teal/90" : "border border-dashed border-border bg-sand text-text-light hover:bg-sand/70"
                      }`}
                      style={{ borderRadius: "6px" }}
                    >
                      {on ? "On" : "Off"}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-text-light">
        On means customers can book it. Off means it is hidden at checkout. Switching a slot off does not cancel orders
        already placed for it.
      </p>
    </div>
  );
}
