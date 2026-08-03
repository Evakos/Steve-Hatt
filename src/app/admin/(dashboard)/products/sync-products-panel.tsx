"use client";

import { useState } from "react";

interface SyncResultRow {
  kind: "product" | "variation";
  productId: number;
  title: string;
  status: "updated" | "skipped" | "error";
  message?: string;
}

interface SyncResponse {
  updated: number;
  errors: number;
  total: number;
  results: SyncResultRow[];
}

export default function SyncProductsPanel() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync-products", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  const problems = result?.results.filter((r) => r.status !== "updated") ?? [];

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="bg-lobster px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderRadius: "5px" }}
      >
        {syncing ? "Syncing…" : "Sync now"}
      </button>

      {error && <p className="mt-3 text-base text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 border border-border bg-white p-4" style={{ borderRadius: "5px" }}>
          <p className="text-base font-medium text-navy">
            {result.updated} updated, {result.errors} error{result.errors === 1 ? "" : "s"}, {result.total} rows read
          </p>
          {problems.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {problems.map((r, i) => (
                <li key={i} className={r.status === "error" ? "text-red-600" : "text-text-light"}>
                  {r.kind === "variation" ? "Variation" : "Product"} {r.title || r.productId}: {r.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
