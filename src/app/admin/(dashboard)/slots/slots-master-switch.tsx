"use client";

import { useState } from "react";

interface Props {
  initialEnabled: boolean;
  /** Called with the saved value after a successful save. */
  onSaved?: (enabled: boolean) => void;
}

/** The master switch: with time slots off, checkout doesn't ask for a slot at all. */
export default function SlotsMasterSwitch({ initialEnabled, onSaved }: Props) {
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
      onSaved?.(data.enabled);
      setEnabled(data.enabled);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 max-w-5xl border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
      <div
        className={`flex items-start justify-between gap-4 border p-4 transition-colors ${
          enabled ? "border-border bg-white" : "border-amber-500 bg-amber-50"
        }`}
        style={{ borderRadius: "5px" }}
      >
        <span>
          <span id="slots-switch-label" className="block text-sm font-medium text-navy">Customers choose a time window at checkout</span>
          <span className="mt-0.5 block text-sm text-text-light">
            {enabled
              ? "On: customers pick a date and a time window (morning or afternoon delivery, or collection), as set up below."
              : "Off: customers still pick a delivery or collection date, but not a time window. A date is offered unless all its slots are switched off below. Christmas orders still pick one of the Christmas days, picked below."}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="slots-switch-label"
          onClick={() => setEnabled(!enabled)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${enabled ? "bg-teal" : "bg-gray-300"}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
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
          <span className="text-sm text-teal">Saved. Time slots are {saved ? "on" : "off"}.</span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
