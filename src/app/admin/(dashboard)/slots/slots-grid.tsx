"use client";

import { useState } from "react";
import { Snowflake, Store, Truck } from "lucide-react";
import { SLOT_WINDOWS, type SlotWindowId } from "@/lib/slots";

interface DateRow {
  /** YYYY-MM-DD */
  key: string;
  label: string;
  /** e.g. "December 2026" */
  month: string;
  isChristmas: boolean;
}

interface Props {
  dates: DateRow[];
  initialDisabled: string[];
  /** The Christmas days staff picked (YYYY-MM-DD), which carry the snowflake and Christmas tag. */
  christmasDays: string[];
  /** Whether customers pick a time window. When off, each day is just Delivery or Collection. */
  windowsOn: boolean;
}

const COLUMNS_WITH_WINDOWS = "grid-cols-[minmax(9.5rem,1.5fr)_repeat(3,minmax(5.5rem,1fr))]";
const COLUMNS_DATE_ONLY = "grid-cols-[minmax(9.5rem,1.5fr)_repeat(2,minmax(5.5rem,1fr))]";

interface Column {
  key: string;
  type: "delivery" | "collection";
  title: string;
  /** The time range, shown under the title when time windows are on. */
  sub: string;
  /** The slot windows this column switches together. */
  ids: SlotWindowId[];
}

export default function SlotsGrid({ dates, initialDisabled, christmasDays, windowsOn }: Props) {
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

  // With time windows on there is a column per window. With them off a day is just Delivery or Collection, and
  // Delivery switches both delivery windows together (a delivery date is offered if either is on).
  const columns: Column[] = windowsOn
    ? SLOT_WINDOWS.map((w) => ({
        key: w.id,
        type: w.type,
        title: w.type === "delivery" ? `Delivery, ${w.name.toLowerCase()}` : "Collection",
        sub: w.time,
        ids: [w.id],
      }))
    : [
        { key: "delivery", type: "delivery", title: "Delivery", sub: "", ids: ["delivery-am", "delivery-pm"] },
        { key: "collection", type: "collection", title: "Collection", sub: "", ids: ["collection"] },
      ];
  const COLUMNS = windowsOn ? COLUMNS_WITH_WINDOWS : COLUMNS_DATE_ONLY;

  const dayKeys = (d: DateRow) => SLOT_WINDOWS.map((w) => keyFor(d.key, w.id));
  const monthKeys = (month: string) => dates.filter((x) => x.month === month).flatMap(dayKeys);

  // One tab per month, so the five months ahead aren't one very long list.
  const months = [...new Set(dates.map((d) => d.month))];
  const [activeMonth, setActiveMonth] = useState(months[0] ?? "");
  const shown = dates.filter((d) => d.month === activeMonth);
  const monthOffCount = (month: string) => monthKeys(month).filter((k) => disabled.includes(k)).length;
  const activeAllOn = monthKeys(activeMonth).every((k) => !disabled.includes(k));

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
    <div className="mt-4 max-w-5xl border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
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

      {months.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div role="tablist" aria-label="Month" className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
            {months.map((m) => {
              const active = m === activeMonth;
              const off = monthOffCount(m);
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveMonth(m)}
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-navy text-white" : "border border-border bg-white text-navy hover:bg-cream"
                  }`}
                  style={{ borderRadius: "999px" }}
                >
                  {m}
                  {off > 0 && (
                    <span
                      className={`px-1.5 text-[11px] font-semibold ${active ? "bg-white/20 text-white" : "bg-sand text-text-light"}`}
                      style={{ borderRadius: "999px" }}
                    >
                      {off} off
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setMany(monthKeys(activeMonth), !activeAllOn)}
            className="shrink-0 text-xs text-text-light underline hover:text-navy"
          >
            {activeAllOn ? "Switch month off" : "Switch month on"}
          </button>
        </div>
      )}

      <div className="mt-3 overflow-x-auto border border-border bg-white shadow-sm" style={{ borderRadius: "16px" }}>
        <div className="min-w-[34rem]">
          {/* Column headings */}
          <div className={`grid ${COLUMNS} items-end gap-2 border-b border-border bg-cream px-4 py-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-light">Day</p>
            {columns.map((col) => (
              <div key={col.key}>
                <p className="flex items-center gap-1 text-xs font-semibold text-navy">
                  {col.type === "delivery" ? <Truck className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                  {col.title}
                </p>
                {col.sub && <p className="text-xs text-text-light">{col.sub}</p>}
              </div>
            ))}
          </div>

          {dates.length === 0 && <p className="px-4 py-6 text-sm text-text-light">There are no bookable days right now.</p>}

          {shown.map((d) => {
            const dayAllOn = dayKeys(d).every((k) => !disabled.includes(k));
            return (
              <div
                key={d.key}
                className={`grid ${COLUMNS} items-center gap-2 border-b border-border px-4 py-2.5 last:border-b-0 ${
                  christmasDays.includes(d.key) ? "bg-[#e8f5ed]/50" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-navy">{d.label}</p>
                  <div className="flex items-center gap-2">
                    {christmasDays.includes(d.key) && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1a3a2a]">
                        <Snowflake className="h-3 w-3" /> Christmas
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setMany(dayKeys(d), !dayAllOn)}
                      className="text-xs text-text-light underline hover:text-navy"
                    >
                      {dayAllOn ? "Switch day off" : "Switch day on"}
                    </button>
                  </div>
                </div>
                {columns.map((col) => {
                  const on = col.ids.some((id) => isOn(d.key, id));
                  return (
                    <button
                      key={col.key}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${d.label}, ${col.title}${col.sub ? ` ${col.sub}` : ""}: ${on ? "on" : "off"}`}
                      onClick={() => setMany(col.ids.map((id) => keyFor(d.key, id)), !on)}
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
