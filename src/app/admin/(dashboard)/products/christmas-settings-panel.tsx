"use client";

import { useState, useEffect } from "react";

export default function ChristmasSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [premiumPercent, setPremiumPercent] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [useDepositFlow, setUseDepositFlow] = useState(false);
  // Tracks the last-saved values so "Save" can be disabled when there's nothing new to apply,
  // and so a failed save doesn't leave the UI claiming a value that was never actually stored.
  const [saved, setSaved] = useState<{ active: boolean; premiumPercent: number; depositAmount: number; useDepositFlow: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/christmas-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { active: boolean; premiumPercent: number; depositAmount: number; christmasUseDepositFlow: boolean }) => {
        setActive(data.active);
        setPremiumPercent(data.premiumPercent);
        setDepositAmount(data.depositAmount ?? 0);
        setUseDepositFlow(data.christmasUseDepositFlow ?? false);
        setSaved({ active: data.active, premiumPercent: data.premiumPercent, depositAmount: data.depositAmount ?? 0, useDepositFlow: data.christmasUseDepositFlow ?? false });
      })
      .catch(() => setError("Couldn't load current settings."))
      .finally(() => setLoading(false));
  }, []);

  const dirty =
    !saved || saved.active !== active || saved.premiumPercent !== premiumPercent || saved.depositAmount !== depositAmount || saved.useDepositFlow !== useDepositFlow;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/christmas-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, premiumPercent, christmasDepositAmount: depositAmount, christmasUseDepositFlow: useDepositFlow }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved({ active, premiumPercent, depositAmount, useDepositFlow });
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
            className="absolute top-1 left-1 h-5 w-5 bg-white transition-transform"
            style={{ borderRadius: "999px", transform: active ? "translateX(20px)" : "translateX(0)" }}
          />
      <div className="mt-3 border border-border bg-cream p-4" style={{ borderRadius: "5px" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy">Payment model</p>
            <p className="text-xs text-text-light">
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
        <p className="mt-2 text-xs text-text-light">
          The deposit/part-payment model is kept as an escape hatch if the shop ever needs it again.
          The default (full payment upfront) takes the entire total immediately, same as a normal
          order — no later capture, no refund, no balance calculation.
        </p>
      </div>

      {useDepositFlow && (
      <div className="mt-3 border border-border bg-cream p-4" style={{ borderRadius: "5px" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-navy">Default deposit (£)</p>
            <p className="text-xs text-text-light">
              Fallback deposit captured at checkout on a Christmas pre-order, used only for products whose{" "}
              &quot;Christmas deposit&quot; cell is blank in the sheet. The per-product Christmas deposit column
              takes priority - leave this £0 to rely on the sheet alone.
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

      <div className="mt-3 border border-dashed border-border bg-cream/60 p-4 opacity-70" style={{ borderRadius: "5px" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-navy">Seasonal price premium (experimental, not active)</p>
          <p className="text-sm font-semibold text-navy">{premiumPercent}%</p>
        </div>
        <p className="text-xs text-text-light">
          Not currently used. Christmas prices are set per-product instead, in the &quot;christmas_price&quot;
          column of the Products sheet below. This blanket-percentage option is kept here in case it&apos;s
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
