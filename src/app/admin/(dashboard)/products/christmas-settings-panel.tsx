"use client";

import { useState, useEffect } from "react";

// The January the next (or current) Christmas break ends in: from July onwards that's next year's.
const now = new Date();
const BREAK_JANUARY_YEAR = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
// The December the last order day falls in: this year's.
const ORDER_DECEMBER_YEAR = now.getFullYear();

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dayLabel(isoDate: string): string {
  const n = Number(isoDate.slice(8, 10));
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix} ${MONTH_NAMES[Number(isoDate.slice(5, 7)) - 1]}`;
}

/** A small month calendar for picking a date between `min` and `max` (both YYYY-MM-DD). No date is
 * chosen until staff click one. */
function DateCalendar({ value, min, max, onChange }: { value: string; min: string; max: string; onChange: (value: string) => void }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const start = value || (todayIso >= min && todayIso <= max ? todayIso : min);
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
          const selected = date === value;
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

export default function ChristmasSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [premiumPercent, setPremiumPercent] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [useDepositFlow, setUseDepositFlow] = useState(false);
  // "" means no reopening date is set.
  const [reopenDate, setReopenDate] = useState("");
  // "" means no date is set. There are no default dates.
  const [lastOrderDate, setLastOrderDate] = useState("");
  const [openDate, setOpenDate] = useState("");
  // Tracks the last-saved values so "Save" can be disabled when there's nothing new to apply,
  // and so a failed save doesn't leave the UI claiming a value that was never actually stored.
  const [saved, setSaved] = useState<{ active: boolean; premiumPercent: number; depositAmount: number; useDepositFlow: boolean; reopenDate: string; lastOrderDate: string; openDate: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/christmas-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { active: boolean; premiumPercent: number; christmasDepositAmount: number; christmasUseDepositFlow: boolean; ordersReopenDate?: string; lastOrderDate?: string; christmasOpenDate?: string }) => {
        // A stored date from a previous year is stale (the server ignores it too), so show the default.
        const storedReopen = data.ordersReopenDate?.startsWith(`${BREAK_JANUARY_YEAR}-`) ? data.ordersReopenDate : "";
        const storedLastOrder = data.lastOrderDate?.startsWith(`${ORDER_DECEMBER_YEAR}-`) ? data.lastOrderDate : "";
        setLastOrderDate(storedLastOrder);
        const storedOpen = data.christmasOpenDate?.startsWith(`${ORDER_DECEMBER_YEAR}-`) ? data.christmasOpenDate : "";
        setOpenDate(storedOpen);
        setActive(data.active);
        setPremiumPercent(data.premiumPercent);
        setDepositAmount(data.christmasDepositAmount ?? 0);
        setUseDepositFlow(data.christmasUseDepositFlow ?? false);
        setReopenDate(storedReopen);
        setSaved({ active: data.active, premiumPercent: data.premiumPercent, depositAmount: data.christmasDepositAmount ?? 0, useDepositFlow: data.christmasUseDepositFlow ?? false, reopenDate: storedReopen, lastOrderDate: storedLastOrder, openDate: storedOpen });
      })
      .catch(() => setError("Couldn't load current settings."))
      .finally(() => setLoading(false));
  }, []);

  const dirty =
    !saved || saved.active !== active || saved.premiumPercent !== premiumPercent || saved.depositAmount !== depositAmount || saved.useDepositFlow !== useDepositFlow || saved.reopenDate !== reopenDate || saved.lastOrderDate !== lastOrderDate || saved.openDate !== openDate;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/christmas-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, premiumPercent, christmasDepositAmount: depositAmount, christmasUseDepositFlow: useDepositFlow, ordersReopenDate: reopenDate, lastOrderDate, christmasOpenDate: openDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved({ active, premiumPercent, depositAmount, useDepositFlow, reopenDate, lastOrderDate, openDate });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="mt-3 text-sm text-text-light">Loading current settings…</p>;
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div>
          <p className="text-sm font-medium text-navy">Christmas ordering</p>
          <p className="mt-1 text-sm text-text-light">Shows the Christmas option to customers site-wide when on.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setActive((v) => !v)}
          className={`relative h-7 w-12 shrink-0 transition-colors ${active ? "bg-teal" : "bg-border"}`}
          style={{ borderRadius: "999px" }}
        >
          <span
            className="absolute top-1 left-1 h-5 w-5 bg-white transition-transform"
            style={{ borderRadius: "999px", transform: active ? "translateX(20px)" : "translateX(0)" }}
          />
          </button>
      </div>

      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy">Payment model</p>
            <p className="mt-1 text-sm text-text-light">
              {useDepositFlow
                ? "Legacy deposit/part-payment: deposit now, balance settled later."
                : "Full payment upfront (default): charged in full at checkout."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={useDepositFlow}
            onClick={() => setUseDepositFlow((v) => !v)}
            className={`relative h-7 w-12 shrink-0 transition-colors ${useDepositFlow ? "bg-[#1a3a2a]" : "bg-teal"}`}
            style={{ borderRadius: "999px" }}
          >
            <span
              className="absolute top-1 left-1 h-5 w-5 bg-white transition-transform"
              style={{ borderRadius: "999px", transform: useDepositFlow ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>
        <p className="mt-2 text-sm text-text-light">
          The deposit/part-payment model is kept as an escape hatch if the shop ever needs it again.
          The default (full payment upfront) takes the entire total immediately, same as a normal
          order, with no later capture, no refund, no balance calculation.
        </p>
      </div>

      {useDepositFlow && (
      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-navy">Default deposit (£)</p>
            <p className="mt-1 text-sm text-text-light">
              Fallback deposit captured at checkout on a Christmas pre-order, used only for products whose{" "}
              &quot;Christmas deposit&quot; cell is blank in the product table. The per-product Christmas deposit column
              takes priority, leave this £0 to rely on the table alone.
            </p>
          </div>
          <input
            type="number"
            min={0}
            step={1}
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            className="w-24 shrink-0 border border-border px-2 py-1 text-right text-sm"
            style={{ borderRadius: "4px" }}
          />
        </div>
      </div>
      )}

      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-navy">First day for Christmas orders</p>
            <p className="mt-1 text-sm text-text-light">
              {openDate
                ? `Christmas ordering opens on ${dayLabel(openDate)}, as long as the switch above is on.`
                : "No opening date is set, so Christmas ordering shows as soon as the switch above is on."}{" "}
              Pick a date to choose when it starts.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DateCalendar value={openDate} min={`${ORDER_DECEMBER_YEAR}-10-01`} max={`${ORDER_DECEMBER_YEAR}-12-24`} onChange={setOpenDate} />
            {openDate && (
              <button type="button" onClick={() => setOpenDate("")} className="text-xs text-text-light underline">
                Clear the date
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-navy">Last day for Christmas orders</p>
            <p className="mt-1 text-sm text-text-light">
              {lastOrderDate
                ? `Online ordering stops after ${dayLabel(lastOrderDate)}. It shows on the site, in the banner and in order emails.`
                : "No last day is set, so ordering does not close for Christmas."}{" "}
              Pick a date up to the 24th December.
            </p>
            {lastOrderDate && !reopenDate && (
              <p className="mt-2 text-sm text-amber-600">
                No reopening date is set below, so ordering stays closed through January. Set one too.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DateCalendar value={lastOrderDate} min={`${ORDER_DECEMBER_YEAR}-12-01`} max={`${ORDER_DECEMBER_YEAR}-12-24`} onChange={setLastOrderDate} />
            {lastOrderDate && (
              <button type="button" onClick={() => setLastOrderDate("")} className="text-xs text-text-light underline">
                Clear the date
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-navy">Reopening after Christmas</p>
            <p className="mt-1 text-sm text-text-light">
              {reopenDate
                ? `Online ordering opens again on ${dayLabel(reopenDate)}.`
                : "No reopening date is set."}{" "}
              After a last order day, ordering stays closed until this date, so set it every year. Orders can&apos;t
              be placed before it.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DateCalendar value={reopenDate} min={`${BREAK_JANUARY_YEAR}-01-01`} max={`${BREAK_JANUARY_YEAR}-01-31`} onChange={setReopenDate} />
            {reopenDate && (
              <button type="button" onClick={() => setReopenDate("")} className="text-xs text-text-light underline">
                Clear the date
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border border-dashed border-border bg-cream/60 p-5 opacity-70" style={{ borderRadius: "14px" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Seasonal price premium (experimental, not active)</p>
          <p className="text-sm font-semibold text-navy">{premiumPercent}%</p>
        </div>
        <p className="mt-1 text-sm text-text-light">
          Not currently used. Christmas prices are set per-product instead, in the &quot;Christmas price&quot;
          column of the product table above. This blanket-percentage option is kept here in case it&apos;s
          ever wanted again, but changing it has no effect on checkout right now.
        </p>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={premiumPercent}
          onChange={(e) => setPremiumPercent(Number(e.target.value))}
          className="mt-3 w-full accent-teal"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-lobster px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "6px" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {!dirty && saved && <span className="text-sm text-teal">Up to date</span>}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
