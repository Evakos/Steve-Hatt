"use client";

import { useState } from "react";

interface Props {
  initialSandbox: boolean;
  /** True while the built-in mock payments (CARDSTREAM_MOCK) are on, which ignore this switch. */
  mock: boolean;
}

export default function PaymentModePanel({ initialSandbox, mock }: Props) {
  const [sandbox, setSandbox] = useState(initialSandbox);
  const [saved, setSaved] = useState(initialSandbox);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = sandbox !== saved;

  async function handleSave() {
    if (!sandbox && !window.confirm("Switch to LIVE? Customers' cards will be charged real money.")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandbox }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(data.sandbox);
      setSandbox(data.sandbox);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border border-border bg-cream p-5" style={{ borderRadius: "14px" }}>
      <label
        className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
          sandbox ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
        }`}
        style={{ borderRadius: "5px" }}
      >
        <input
          type="checkbox"
          checked={sandbox}
          onChange={(e) => setSandbox(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-navy"
        />
        <span>
          <span className="block text-sm font-medium text-navy">Test mode</span>
          <span className="mt-0.5 block text-sm text-text-light">
            {sandbox
              ? "Ticked: payments go to Pay360's test system. Test cards only, no real money is taken."
              : "Unticked: LIVE. Real cards, real money. Only use this once everything has been tested."}
          </span>
        </span>
      </label>

      {mock && (
        <p className="mt-4 bg-sand p-3 text-sm text-navy" style={{ borderRadius: "5px" }}>
          The built-in test payments are switched on, so this tick box has no effect yet. It starts working once real
          Pay360 payments are connected and the built-in test payments are turned off.
        </p>
      )}

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
          <span className="text-sm text-teal">Saved. Payments are in {saved ? "test" : "live"} mode.</span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
