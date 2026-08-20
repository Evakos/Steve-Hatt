"use client";

import { useCallback, useState } from "react";
import type { CheckoutRequest } from "@/lib/checkout/schema";

export type CheckoutSubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "requires_action"; transactionId: string; orderRef: string; challenge: unknown }
  | { phase: "confirming" }
  | { phase: "authorised"; orderId: number; orderNumber: string; estimatedTotal: number; depositAmount?: number }
  | { phase: "declined"; reason: string }
  | { phase: "error"; message: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/** Orchestrates the checkout submission: tokenize (via PaymentPanel) → /api/checkout → branch on authorised/requires_action/declined. */
export function useCheckoutSubmit() {
  const [state, setState] = useState<CheckoutSubmitState>({ phase: "idle" });

  const submit = useCallback(async (checkout: CheckoutRequest) => {
    // Belt-and-suspenders against a duplicate submission racing in (the UI already removes the
    // payment buttons once submitting, but don't rely on that alone — see the double-charge
    // incident this guarded against on another site's checkout).
    if (state.phase === "submitting" || state.phase === "confirming") return;
    setState({ phase: "submitting" });
    try {
      const { res, data } = await postJson("/api/checkout", checkout);
      if (res.status === 402) {
        setState({ phase: "declined", reason: data.reason ?? "Payment declined" });
        return;
      }
      if (!res.ok) {
        setState({ phase: "error", message: "Something went wrong. Please try again." });
        return;
      }
      if (data.status === "requires_action") {
        setState({
          phase: "requires_action",
          transactionId: data.transactionId,
          orderRef: data.orderRef,
          challenge: data.challenge,
        });
        return;
      }
      setState({ phase: "authorised", orderId: data.orderId, orderNumber: data.orderNumber, estimatedTotal: data.estimatedTotal, depositAmount: data.depositAmount });
    } catch {
      setState({ phase: "error", message: "Network error. Please try again." });
    }
  }, [state.phase]);

  const confirmThreeDS = useCallback(
    async (checkout: CheckoutRequest, threeDSResponse: unknown) => {
      if (state.phase !== "requires_action") return;
      const { transactionId, orderRef } = state;
      setState({ phase: "confirming" });
      try {
        const { res, data } = await postJson("/api/checkout/confirm", {
          transactionId,
          orderRef,
          threeDSResponse,
          checkout,
        });
        if (res.status === 402) {
          setState({ phase: "declined", reason: data.reason ?? "Payment declined" });
          return;
        }
        if (!res.ok) {
          setState({ phase: "error", message: "Something went wrong. Please try again." });
          return;
        }
        setState({ phase: "authorised", orderId: data.orderId, orderNumber: data.orderNumber, estimatedTotal: data.estimatedTotal, depositAmount: data.depositAmount });
      } catch {
        setState({ phase: "error", message: "Network error. Please try again." });
      }
    },
    [state]
  );

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, submit, confirmThreeDS, reset };
}
