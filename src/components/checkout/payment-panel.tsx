"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { tokeniseCard } from "@/lib/cardlock/tokenise";

interface Props {
  amount: number;
  onToken: (token: string) => void;
  disabled?: boolean;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");

function formatNumber(raw: string): string {
  const d = digitsOnly(raw).slice(0, 19);
  if (/^3[47]/.test(d)) return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const d = digitsOnly(raw).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function brandOf(d: string): string {
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "";
}

function passesLuhn(d: string): boolean {
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function expiryProblem(expiry: string): string | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!m) return "Enter the expiry as MM/YY.";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Enter a valid expiry month.";
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "That card has expired.";
  return null;
}

const input = "mt-1 w-full border border-border bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-navy";
const label = "block text-xs font-medium text-navy";

/**
 * The card form, as ordinary fields on the checkout page (so browsers can autofill them). The card
 * is turned into a token in the browser (see lib/cardlock/tokenise.ts) and only the token goes on to
 * our server, which charges it: card numbers never pass through our server or WordPress.
 */
export default function PaymentPanel({ amount, onToken, disabled }: Props) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"name" | "number" | "expiry" | "cvc" | "form", string>>>({});
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState(false);

  useEffect(() => {
    fetch("/api/payment-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => setMock(cfg?.mock === true))
      .catch(() => {});
  }, []);

  const digits = digitsOnly(number);
  const brand = brandOf(digits);
  const cvcLength = brand === "Amex" ? 4 : 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || disabled) return;

    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter the name on the card.";
    if (digits.length < 13 || !passesLuhn(digits)) next.number = "Check the card number.";
    const expiryError = expiryProblem(expiry);
    if (expiryError) next.expiry = expiryError;
    if (digitsOnly(cvc).length !== cvcLength) next.cvc = `Enter the ${cvcLength}-digit security code.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const result = await tokeniseCard({ name: name.trim(), number: digits, expiry, cvc: digitsOnly(cvc) });
    if (!result.ok) {
      setErrors({ form: result.error });
      setBusy(false);
      return;
    }
    onToken(result.token);
  }

  const error = (key: keyof typeof errors) =>
    errors[key] ? <p className="mt-1 text-xs text-lobster">{errors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-border bg-card p-5" style={{ borderRadius: "5px" }}>
      <div>
        <label htmlFor="card-name" className={label}>
          Name on card
        </label>
        <input
          id="card-name"
          type="text"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
          style={{ borderRadius: "5px" }}
        />
        {error("name")}
      </div>

      <div className="mt-4">
        <label htmlFor="card-number" className={label}>
          Card number
        </label>
        <div className="relative">
          <input
            id="card-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            value={number}
            onChange={(e) => setNumber(formatNumber(e.target.value))}
            className={`${input} pr-24`}
            style={{ borderRadius: "5px" }}
          />
          {brand && (
            <span className="pointer-events-none absolute top-1/2 right-3 mt-0.5 -translate-y-1/2 text-xs font-medium text-text-light">
              {brand}
            </span>
          )}
        </div>
        {error("number")}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="card-expiry" className={label}>
            Expiry date
          </label>
          <input
            id="card-expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className={input}
            style={{ borderRadius: "5px" }}
          />
          {error("expiry")}
        </div>
        <div>
          <label htmlFor="card-cvc" className={label}>
            Security code
          </label>
          <input
            id="card-cvc"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "Amex" ? "4 digits" : "3 digits"}
            value={cvc}
            onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
            className={input}
            style={{ borderRadius: "5px" }}
          />
          {error("cvc")}
        </div>
      </div>

      {error("form")}

      <button
        type="submit"
        disabled={busy || disabled}
        className="mt-5 flex w-full items-center justify-center gap-2 bg-lobster px-6 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderRadius: "6px" }}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </>
        ) : (
          <>Pay £{amount.toFixed(2)}</>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-text-light">
        <Lock className="h-3 w-3 shrink-0 text-teal" />
        Your card details are handled by our payment provider, Pay360, and never stored on our site.
      </p>

      {mock && (
        <p className="mt-3 bg-sand p-3 text-xs leading-relaxed text-navy" style={{ borderRadius: "5px" }}>
          Test payments are on. Use 4242 4242 4242 4242 (approved), 4000 0000 0000 0002 (declined) or 4000 0000 0000 3220
          (3D Secure), any future expiry and any security code. No real card is used.
        </p>
      )}
    </form>
  );
}
