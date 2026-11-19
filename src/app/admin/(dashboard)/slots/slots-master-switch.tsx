"use client";

import { useState } from "react";

interface Props {
  initialEnabled: boolean;
}

/** The master switch: with time slots off, checkout doesn't ask for a slot at all. */
export default function SlotsMasterSwitch({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saved, setSaved] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = enabled !== saved;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots-enabled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(data.enabled);
      setEnabled(data.enabled);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 max-w-3xl border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
      <label
        className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
          enabled ? "border-border bg-white" : "border-amber-500 bg-amber-50"
        }`}
        style={{ borderRadius: "5px" }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
        />
        <span>
          <span className="block text-sm font-medium text-navy">Customers choose a time slot at checkout</span>
          <span className="mt-0.5 block text-sm text-text-light">
            {enabled
              ? "On: customers pick a delivery or collection slot, as set up below."
              : "Off: checkout does not ask for a slot. Customers still choose delivery or collection, and the order says the time is to be arranged. Christmas pre-orders are paused while this is off, because they are booked by date."}
          </span>
        </span>
      </label>

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
          <span className="text-sm text-teal">Saved. Time slots are {saved ? "on" : "off"}.</span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
