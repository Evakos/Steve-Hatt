"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { tokeniseCard } from "@/lib/cardlock/tokenise";

interface Props {
  amount: number;
  onToken: (token: string) => void;
  disabled?: boolean;
}

type Brand = "Visa" | "Mastercard" | "Amex";

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

/** Which card it is, from the first digits: Visa 4, Mastercard 51-55 or 2221-2720, Amex 34 or 37. */
function brandOf(d: string): Brand | "" {
  if (/^4/.test(d)) return "Visa";
  const two = Number(d.slice(0, 2));
  const four = Number(d.slice(0, 4));
  if ((d.length >= 2 && two >= 51 && two <= 55) || (d.length >= 4 && four >= 2221 && four <= 2720)) return "Mastercard";
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

/** Small card logos, drawn here so there is nothing to download. */
function BrandBadge({ brand, dim }: { brand: Brand; dim?: boolean }) {
  const common = { viewBox: "0 0 32 20", className: `h-5 w-8 transition-opacity ${dim ? "opacity-40" : ""}`, "aria-label": brand, role: "img" } as const;
  if (brand === "Visa") {
    return (
      <svg {...common}>
        <rect width="32" height="20" rx="3" fill="#fff" stroke="#d8d2c8" />
        <text x="16" y="14" textAnchor="middle" fontSize="9" fontWeight="800" fontStyle="italic" fill="#1A1F71" fontFamily="Arial, sans-serif">
          VISA
        </text>
      </svg>
    );
  }
  if (brand === "Mastercard") {
    return (
      <svg {...common}>
        <rect width="32" height="20" rx="3" fill="#fff" stroke="#d8d2c8" />
        <circle cx="12.5" cy="10" r="6" fill="#EB001B" />
        <circle cx="19.5" cy="10" r="6" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="32" height="20" rx="3" fill="#2E77BC" />
      <text x="16" y="13.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">
        AMEX
      </text>
    </svg>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  /** Sits inside the field on the right, such as the card logos. */
  right?: React.ReactNode;
};

/** A text field whose label sits inside it and floats up to the top edge once there is something to label. */
function Field({ id, label, error, right, className = "", ...rest }: FieldProps) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          className={`peer h-12 w-full border bg-white px-3 pt-4 pb-1 text-sm text-navy outline-none transition-colors ${
            error ? "border-lobster" : "border-border focus:border-navy"
          } ${className}`}
          style={{ borderRadius: "5px" }}
          {...rest}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-text-light transition-all duration-150 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]"
        >
          {label}
        </label>
        {right}
      </div>
      {error && <p className="mt-1 text-xs text-lobster">{error}</p>}
    </div>
  );
}

/**
 * The card form, as ordinary compact fields on the checkout page (so browsers can autofill them). The
 * card is turned into a token in the browser (see lib/cardlock/tokenise.ts) and only the token goes on
 * to our server, which charges it: card numbers never pass through our server or WordPress.
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
    if (digits.length < 13 || !passesLuhn(digits)) next.number = "Check the card number.";
    const expiryError = expiryProblem(expiry);
    if (expiryError) next.expiry = expiryError;
    if (digitsOnly(cvc).length !== cvcLength) next.cvc = `Enter the ${cvcLength}-digit code.`;
    if (name.trim().length < 2) next.name = "Enter the name on the card.";
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

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-border bg-card p-4" style={{ borderRadius: "5px" }}>
      <div className="space-y-3">
        <Field
          id="card-number"
          label="Card number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={number}
          onChange={(e) => setNumber(formatNumber(e.target.value))}
          error={errors.number}
          className="pr-24"
          right={
            <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
              {brand ? (
                <BrandBadge brand={brand} />
              ) : (
                <>
                  <BrandBadge brand="Visa" dim />
                  <BrandBadge brand="Mastercard" dim />
                </>
              )}
            </span>
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            id="card-expiry"
            label="Expiry (MM/YY)"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            error={errors.expiry}
          />
          <Field
            id="card-cvc"
            label="Security code"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvc}
            onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
            error={errors.cvc}
          />
        </div>

        <Field
          id="card-name"
          label="Name on card"
          type="text"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
      </div>

      {errors.form && <p className="mt-3 text-xs text-lobster">{errors.form}</p>}

      <button
        type="submit"
        disabled={busy || disabled}
        className="mt-4 flex w-full items-center justify-center gap-2 bg-lobster px-6 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-light">
        <Lock className="h-3 w-3 shrink-0 text-teal" />
        Card details are handled by our payment provider, Pay360, and never stored on our site.
      </p>

      {mock && (
        <p className="mt-2.5 bg-sand p-2.5 text-[11px] leading-relaxed text-navy" style={{ borderRadius: "5px" }}>
          Test payments are on. Use 4242 4242 4242 4242 (approved), 4000 0000 0000 0002 (declined) or 4000 0000 0000 3220
          (3D Secure), any future expiry and any security code.
        </p>
      )}
    </form>
  );
}
