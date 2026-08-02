"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useCart, lineTotal } from "@/lib/cart-context";

export default function MiniCart() {
  const { items, removeItem, miniCartOpen, setMiniCartOpen, estimatedTotal } = useCart();

  if (!miniCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setMiniCartOpen(false)} />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-border bg-white shadow-lg" style={{ borderRadius: "5px" }}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-navy">Your Order</p>
          <button onClick={() => setMiniCartOpen(false)} className="text-text-light hover:text-navy">
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-text-light">
            Your basket is empty
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto">
              {items.map((item) => {
                return (
                  <div key={item.id} className="flex gap-3 border-b border-border/50 px-4 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-cream" style={{ borderRadius: "3px" }}>
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-sm text-text-light">{item.preparation}</p>
                      <p className="mt-0.5 text-sm font-medium text-navy">£{lineTotal(item).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 self-center text-text-light hover:text-lobster"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-light">Estimated total</span>
                <span className="text-sm font-bold text-navy">£{estimatedTotal.toFixed(2)}</span>
              </div>
              <Link
                href="/cart"
                onClick={() => setMiniCartOpen(false)}
                className="mt-3 block w-full bg-lobster px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-lobster/90"
                style={{ borderRadius: "3px" }}
              >
                View Basket
              </Link>
              <Link
                href="/checkout"
                onClick={() => setMiniCartOpen(false)}
                className="mt-2 block w-full border border-navy bg-white px-4 py-2.5 text-center text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-white"
                style={{ borderRadius: "3px" }}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
