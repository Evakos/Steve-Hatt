"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCart, lineTotal } from "@/lib/cart-context";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, estimatedTotal } = useCart();

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-serif text-3xl font-bold text-navy">Your Order</h1>
          <p className="mt-2 text-base text-text-light">
            {items.length === 0
              ? "Your basket is empty."
              : `${items.length} item${items.length > 1 ? "s" : ""} in your basket`}
          </p>

          {items.length === 0 ? (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <ShoppingBag className="h-12 w-12 text-text-light/40" />
              <p className="text-base text-text-light">
                Browse our fresh selection and add items to your order.
              </p>
              <Link
                href="/#shop"
                className="bg-lobster px-6 py-3 text-base font-medium text-white transition-colors hover:bg-lobster/90"
                style={{ borderRadius: "3px" }}
              >
                Shop Today&apos;s Catch
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* Items list */}
              <div className="space-y-4 lg:col-span-2">
                {items.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 border border-border bg-white p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <div
                        className="relative h-20 w-20 shrink-0 overflow-hidden bg-sand"
                        style={{ borderRadius: "3px" }}
                      >
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="font-serif text-base font-semibold text-navy">
                              {item.product.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-text-light transition-colors hover:text-lobster"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-text-light">
                            {item.preparation}
                            {item.product.pricePerKg > 0 && ` · ${item.weight}kg`}
                          </p>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                          <div className="flex items-center border border-border bg-cream" style={{ borderRadius: "3px" }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-xs text-navy transition-colors hover:bg-sand"
                            >
                              -
                            </button>
                            <span className="min-w-7 px-1 py-1 text-center text-xs font-medium text-navy">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-xs text-navy transition-colors hover:bg-sand"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-base font-semibold text-navy">
                            £{lineTotal(item).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={clearCart}
                  className="text-sm text-text-light underline hover:text-navy"
                >
                  Clear basket
                </button>
              </div>

              {/* Order summary */}
              <div className="lg:col-span-1">
                <div
                  className="border border-border bg-white p-6"
                  style={{ borderRadius: "5px" }}
                >
                  <h2 className="font-serif text-lg font-semibold text-navy">
                    Order Summary
                  </h2>

                  <div className="mt-4 space-y-3 text-base">
                    <div className="flex justify-between text-text-light">
                      <span>Estimated subtotal</span>
                      <span>£{estimatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-light">
                      <span>Delivery</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-semibold text-navy">
                        <span>Estimated total</span>
                        <span>£{estimatedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-4 border border-ocean/20 bg-ocean-light p-3"
                    style={{ borderRadius: "3px" }}
                  >
                    <p className="text-sm leading-relaxed text-navy">
                      <strong>Fair pricing.</strong> Final amount may differ
                      slightly once your order is weighed and prepared.
                    </p>
                  </div>

                  <Link
                    href="/checkout"
                    className="mt-6 block w-full bg-lobster px-6 py-3.5 text-center text-base font-medium tracking-wide text-white transition-colors hover:bg-lobster/90"
                    style={{ borderRadius: "3px" }}
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    href="/#shop"
                    className="mt-3 block text-center text-sm text-text-light hover:text-navy"
                  >
                    ← Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
            </div>
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} Steve Hatt Fishmongers
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
