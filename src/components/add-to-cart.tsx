"use client";

import { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { computeUnitPrice } from "@/lib/pricing";
import CustomSelect from "@/components/custom-select";

const WEIGHT_CHOICES = [
  { value: 0.1, label: "100g" },
  { value: 0.2, label: "200g" },
  { value: 0.3, label: "300g" },
  { value: 0.5, label: "500g" },
  { value: 1, label: "1kg" },
];

const prepTooltips: Record<string, string> = {
  "Scaled & Cleaned": "Scales removed, gutted and washed. Ready to cook whole, roast, or stuff.",
  "Cleaned Only": "Gutted and washed but scales left on. Ideal for barbecuing or baking in salt crust.",
  "Filleted (skin removed)": "Boned and skinned into fillets. Ready to pan-fry, poach, or bake.",
  "Opened (ready to eat)": "Shucked and served on the half shell. Ready to eat immediately.",
  "Unopened": "Delivered whole in the shell. You open them at home for maximum freshness.",
  "Sliced (ready to eat)": "Hand-sliced and ready to serve. No preparation needed.",
  "Whole cooked": "Boiled whole and ready to eat. Just crack and enjoy.",
  "Split and cleaned": "Split in half lengthways, cleaned and ready to grill or roast.",
  "Live (whole)": "Delivered alive for maximum freshness. Cook within 24 hours of delivery.",
  "Ready to eat": "No preparation needed. Enjoy straight from the pack.",
  "Filleted (skin on)": "Boned into fillets with the skin left on. Ready to pan-fry skin side down for crisp skin.",
  "Peeled (raw)": "Shell removed, raw and ready to cook. Cook thoroughly before eating.",
  "Shell-on (raw)": "Raw and still in the shell, which keeps them juicy and adds flavour. Cook thoroughly before eating.",
  "Whole (gutted & scaled)": "Whole fish, gutted and scaled. Ready to roast, bake or barbecue.",
};

interface Props {
  product: Product;
}

export default function AddToCart({ product }: Props) {
  const { addItem } = useCart();
  const [selectedPrep, setSelectedPrep] = useState(product.preparation[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizeOptions?.[0]?.label ?? "");
  const [weight, setWeight] = useState(0.2);
  const [quantity, setQuantity] = useState(product.priceType === "per-piece" ? 6 : 1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockStatus === "outofstock";
  // Christmas break (after 17th December until the new year): no online orders, so the button is
  // disabled. Product pages are static, so this asks the server in the browser (same endpoint as
  // the banner) and reacts the moment the window opens, with no rebuild.
  const [ordersClosed, setOrdersClosed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setOrdersClosed(data?.ordersClosed === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const unavailable = outOfStock || ordersClosed;

  const selectedSizeOption = product.sizeOptions?.find((s) => s.label === selectedSize);

  const unitPrice = computeUnitPrice(
    { pricePerKg: product.pricePerKg, price: product.price, sizeOptionPrice: selectedSizeOption?.price },
    weight
  );

  const handleAdd = () => {
    addItem({
      product,
      quantity,
      weight,
      preparation: selectedPrep,
      unitPrice,
      wooVariationId: selectedSizeOption?.wooVariationId,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Preparation options */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-navy">Preparation</p>
        <div className="flex flex-wrap gap-1.5">
          {product.preparation.map((opt) => (
            <div key={opt} className="group relative">
              <button
                onClick={() => setSelectedPrep(opt)}
                className={`flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-2 text-[13px] transition-colors ${
                  selectedPrep === opt
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-navy hover:border-navy"
                }`}
                style={{ borderRadius: "6px" }}
              >
                {opt}
                {prepTooltips[opt] && (
                  <Info className={`h-3 w-3 ${selectedPrep === opt ? "text-white/60" : "text-text-light"}`} />
                )}
              </button>
              {prepTooltips[opt] && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-44 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="bg-white px-3.5 py-2.5 text-xs leading-snug text-navy" style={{ borderRadius: "2px", boxShadow: "0 2px 10px rgba(0,0,0,0.14)" }}>
                    {prepTooltips[opt]}
                  </div>
                  <div className="mx-auto h-0 w-0 border-x-[7px] border-t-[7px] border-x-transparent border-t-white" style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.08))" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Size selector (salmon, lobsters) */}
      {product.sizeOptions && product.sizeOptions.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-navy">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizeOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSelectedSize(opt.label)}
                className={`border px-3 py-2 text-sm transition-colors ${
                  selectedSize === opt.label
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-navy hover:border-navy"
                }`}
                style={{ borderRadius: "6px" }}
              >
                {opt.label} · £{opt.price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weight selector (per-kg items like hot smoked salmon) */}
      {product.priceType === "per-kg" && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-navy">Approximate weight</p>
          <div className="flex flex-wrap items-center gap-4">
            <CustomSelect
              ariaLabel="Approximate weight"
              value={weight}
              onChange={setWeight}
              options={WEIGHT_CHOICES.map((w) => ({ ...w, hint: `£${(product.pricePerKg * w.value).toFixed(2)}` }))}
            />
            <span className="text-sm text-text-light">
              Estimated{" "}
              <span className="font-semibold text-navy">£{(product.pricePerKg * weight).toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Quantity + Add to order */}
      <div className="mt-6 flex items-end gap-3">
        <div>
          <p className="mb-2 text-sm font-medium text-navy">Quantity</p>
          <div className="flex items-center border border-border bg-white" style={{ borderRadius: "3px" }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-3 text-sm text-navy transition-colors hover:bg-sand"
            >
              -
            </button>
            <span className="min-w-10 px-2 py-3 text-center text-sm font-medium text-navy">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-3 text-sm text-navy transition-colors hover:bg-sand"
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={unavailable}
          className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-colors ${
            unavailable
              ? "cursor-not-allowed bg-border text-text-light"
              : added
                ? "bg-teal text-white"
                : "bg-lobster text-white hover:bg-lobster/90"
          }`}
          style={{ borderRadius: "6px" }}
        >
        {outOfStock ? (
          "Out of stock"
        ) : ordersClosed ? (
          "Online ordering closed until the new year"
        ) : added ? (
          <>
            <Check className="h-4 w-4" />
            Added to Order
          </>
        ) : (
          <>
            Add to Order · £{(unitPrice * quantity).toFixed(2)}
          </>
        )}
      </button>
      </div>
    </>
  );
}
