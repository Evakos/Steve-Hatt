"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

/**
 * A clear label above the card form while payments are in Pay360's sandbox, so nobody mistakes a
 * test checkout for a real one. Shows nothing in live mode, or when the built-in mock is on (the
 * mock labels itself).
 */
export default function SandboxNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/payment-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { sandbox?: boolean; mock?: boolean } | null) => setShow(data?.sandbox === true && data?.mock !== true))
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="mb-3 flex items-start gap-3 bg-amber-50 p-3 text-amber-900" style={{ borderRadius: "5px" }}>
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-sm">
        <strong className="font-medium">Sandbox mode.</strong> No real money is taken. Use Pay360 test cards only.
      </p>
    </div>
  );
}
