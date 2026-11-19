"use client";

import { useState } from "react";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function dayLabel(isoDate: string): string {
  const n = Number(isoDate.slice(8, 10));
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix} ${MONTH_NAMES[Number(isoDate.slice(5, 7)) - 1]}`;
}

/** A small month calendar for picking a date between `min` and `max` (both YYYY-MM-DD). No date is
 * chosen until staff click one. */
export function DateCalendar({
  value,
  min,
  max,
  onChange,
  values,
}: {
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  /** When given, several days can be picked: clicking a day adds or removes it (via onChange). */
  values?: string[];
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const start = value || values?.[0] || (todayIso >= min && todayIso <= max ? todayIso : min);
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 });
  const monthIndex = (year: number, month: number) => year * 12 + month;
  const minM = monthIndex(Number(min.slice(0, 4)), Number(min.slice(5, 7)) - 1);
  const maxM = monthIndex(Number(max.slice(0, 4)), Number(max.slice(5, 7)) - 1);
  const viewM = monthIndex(view.year, view.month);
  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const iso = (day: number) => `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
  const move = (delta: number) =>
    setView((v) => {
      const m = monthIndex(v.year, v.month) + delta;
      return { year: Math.floor(m / 12), month: m % 12 };
    });
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  return (
    <div className="w-56 border border-border bg-white p-3" style={{ borderRadius: "8px" }}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} disabled={viewM <= minM} aria-label="Previous month" className="px-2 text-navy disabled:opacity-30">
          ‹
        </button>
        <p className="text-sm font-medium text-navy">
          {MONTH_NAMES[view.month]} {view.year}
        </p>
        <button type="button" onClick={() => move(1)} disabled={viewM >= maxM} aria-label="Next month" className="px-2 text-navy disabled:opacity-30">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-light">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const date = iso(day);
          const disabled = date < min || date > max;
          const selected = values ? values.includes(date) : date === value;
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(date)}
              className={`h-7 rounded text-xs transition-colors ${
                selected
                  ? "bg-navy font-medium text-white"
                  : disabled
                    ? "cursor-not-allowed text-text-light/40"
                    : date === todayIso
                      ? "border border-navy text-navy hover:bg-sand"
                      : "text-navy hover:bg-sand"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

