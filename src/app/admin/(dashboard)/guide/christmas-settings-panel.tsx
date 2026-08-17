"use client";

import { useState, useEffect } from "react";

export default function ChristmasSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [premiumPercent, setPremiumPercent] = useState(0);
  // Tracks the last-saved values so "Save" can be disabled when there's nothing new to apply,
  // and so a failed save doesn't leave the UI claiming a value that was never actually stored.
  const [saved, setSaved] = useState<{ active: boolean; premiumPercent: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/christmas-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { active: boolean; premiumPercent: number }) => {
        setActive(data.active);
        setPremiumPercent(data.premiumPercent);
        setSaved(data);
      })
      .catch(() => setError("Couldn't load current settings."))
      .finally(() => setLoading(false));
  }, []);

  const dirty = !saved || saved.active !== active || saved.premiumPercent !== premiumPercent;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/christmas-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, premiumPercent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved({ active, premiumPercent });
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
    <div className="mt-3">
      <div className="flex items-center justify-between border border-border bg-cream p-4" style={{ borderRadius: "5px" }}>
        <div>
          <p className="text-sm font-medium text-navy">Christmas ordering</p>
          <p className="text-xs text-text-light">Shows the Christmas option to customers site-wide when on.</p>
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
            className="absolute top-1 h-5 w-5 bg-white transition-transform"
            style={{ borderRadius: "999px", transform: active ? "translateX(22px)" : "translateX(4px)" }}
          />
        </button>
      </div>

      <div className="mt-3 border border-border bg-cream p-4" style={{ borderRadius: "5px" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Seasonal price premium</p>
          <p className="text-sm font-semibold text-navy">{premiumPercent}%</p>
        </div>
        <p className="text-xs text-text-light">Added to every product&apos;s price, only for Christmas orders.</p>
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
          className="bg-lobster px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "5px" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {!dirty && saved && <span className="text-sm text-teal">Up to date</span>}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
