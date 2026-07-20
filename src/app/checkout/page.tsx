"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  Store,
  Check,
  Gift,
  CreditCard,
  ChevronLeft,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useCart, lineTotal } from "@/lib/cart-context";
import {
  normalisePostcode,
  extractOutcode,
  isInDeliveryZone,
} from "@/lib/delivery-zones";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import ContactAddressForm, { EMPTY_CONTACT_ADDRESS, type ContactAddressValue } from "@/components/checkout/contact-address-form";
import PaymentPanel from "@/components/checkout/payment-panel";
import ThreeDSChallenge from "@/components/checkout/three-ds-challenge";
import { useCheckoutSubmit } from "@/components/checkout/use-checkout-submit";
import type { CheckoutRequest } from "@/lib/checkout/schema";

type SlotType = "delivery" | "collection";
type Step = "delivery" | "payment";

interface Slot {
  date: Date;
  label: string;
  type: SlotType;
  isChristmas: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function isTueToSat(date: Date): boolean {
  const day = date.getDay();
  return day >= 2 && day <= 6;
}

// Demo: simulate date as 1st November so Christmas slots are visible
const DEMO_TODAY = new Date(2026, 10, 1);

function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date(DEMO_TODAY);
  today.setHours(0, 0, 0, 0);

  // Standard slots: next 21 days (Tue-Sat only)
  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (isTueToSat(d)) {
      dates.push(d);
    }
  }

  // Always include Christmas dates (Dec 20-24) if we're from Nov 1 onwards
  const year = today.getFullYear();
  const christmasYear = today.getMonth() >= 10 ? year : year; // Nov=10
  if (today.getMonth() >= 10 || (today.getMonth() === 11)) {
    for (let day = 20; day <= 24; day++) {
      const d = new Date(christmasYear, 11, day);
      if (isTueToSat(d) && d > today && !dates.some((existing) => existing.getTime() === d.getTime())) {
        dates.push(d);
      }
    }
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}

function isChristmasDate(date: Date): boolean {
  return date.getMonth() === 11 && date.getDate() >= 20 && date.getDate() <= 24;
}

export default function CheckoutPage() {
  const { items, estimatedTotal, clearCart } = useCart();
  const { state: submitState, submit, confirmThreeDS, reset: resetSubmit } = useCheckoutSubmit();

  // Snapshot the slot/christmas-ness at the moment of payment, so the confirmation screen can
  // still show them after clearCart() empties `items`.
  const [confirmedOrder, setConfirmedOrder] = useState<{ itemCount: number; slot: Slot; isChristmas: boolean } | null>(null);
  // The token that triggered the 3DS challenge — the confirm request resends the full checkout
  // payload (schema requires a non-empty payment.token), so this needs to be threaded through.
  const pendingTokenRef = useRef<string | null>(null);

  // Cart is cleared exactly once, right when payment succeeds — not during render (that would
  // update CartProvider's state while this component renders, which React disallows).
  useEffect(() => {
    if (submitState.phase === "authorised") clearCart();
  }, [submitState.phase, clearCart]);

  const [contact, setContact] = useState<ContactAddressValue>(EMPTY_CONTACT_ADDRESS);
  // Drives the "we'll save your details" notice below — only shown to guests, since a
  // signed-in customer already knows they have an account.
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Prefill from a signed-in customer's saved details — silently does nothing for guests (401 is
  // the expected response, not an error worth surfacing) or if they've already started typing.
  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me: ContactAddressValue | null) => {
        if (!me) return;
        setIsSignedIn(true);
        setContact((prev) => (prev.email || prev.firstName ? prev : me));
      })
      .catch(() => {});
  }, []);

  const [step, setStep] = useState<Step>("delivery");

  // Christmas or standard?
  const [orderType, setOrderType] = useState<"standard" | "christmas" | null>(null);

  // Delivery method
  const [slotType, setSlotType] = useState<SlotType | null>(null);

  // Postcode (delivery only)
  const [postcode, setPostcode] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<
    "idle" | "valid" | "out-of-zone" | "invalid"
  >("idle");

  // Slot
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  function handlePostcodeCheck() {
    const normalised = normalisePostcode(postcode);
    const outcode = extractOutcode(normalised);
    if (!outcode || normalised.length < 5) {
      setPostcodeStatus("invalid");
      return;
    }
    const inZone = isInDeliveryZone(postcode);
    setPostcodeStatus(inZone ? "valid" : "out-of-zone");
    setSelectedSlot(null);
    if (!inZone) {
      setSlotType("collection");
    } else {
      setSlotType(null);
    }
  }

  const postcodeChecked = postcodeStatus === "valid" || postcodeStatus === "out-of-zone";
  const showSlots = !!slotType && postcodeChecked;

  const slots = useMemo(() => {
    if (!slotType || !orderType) return [];
    const dates = getAvailableDates();
    const result: Slot[] = [];

    dates.forEach((date) => {
      const christmas = isChristmasDate(date);
      if (orderType === "christmas" && !christmas) return;
      if (orderType === "standard" && christmas) return;

      if (slotType === "delivery") {
        result.push({ date, label: `${formatDate(date)} · Morning (9am-12pm)`, type: "delivery", isChristmas: christmas });
        result.push({ date, label: `${formatDate(date)} · Afternoon (12pm-5pm)`, type: "delivery", isChristmas: christmas });
      } else {
        result.push({ date, label: `${formatDate(date)} · Collection (7am-5pm)`, type: "collection", isChristmas: christmas });
      }
    });
    return result;
  }, [slotType, orderType]);

  const isChristmasOrder = orderType === "christmas";
  const canProceedToPayment = !!selectedSlot;
  const deliveryCost = slotType === "delivery" ? 5 : 0;

  function buildCheckoutRequest(): CheckoutRequest | null {
    if (!selectedSlot || !slotType) return null;
    return {
      items: items.map((item) => ({
        wooProductId: item.product.wooId,
        wooVariationId: item.wooVariationId,
        quantity: item.quantity,
        weight: item.weight,
        preparation: item.preparation,
        productName: item.product.name,
      })),
      fulfilment: {
        type: slotType,
        slot: { date: selectedSlot.date.toISOString(), label: selectedSlot.label, isChristmas: selectedSlot.isChristmas },
        postcode: slotType === "delivery" ? postcode : undefined,
      },
      customer: {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        address:
          slotType === "delivery"
            ? {
                line1: contact.address.line1,
                line2: contact.address.line2 || undefined,
                city: contact.address.city,
                postcode: contact.address.postcode,
              }
            : undefined,
      },
      payment: { token: "" }, // filled in by the caller once PaymentPanel returns a token
    };
  }

  function handleToken(token: string) {
    if (!selectedSlot) return;
    const request = buildCheckoutRequest();
    if (!request) return;
    pendingTokenRef.current = token;
    setConfirmedOrder({ itemCount: items.length, slot: selectedSlot, isChristmas: isChristmasOrder });
    submit({ ...request, payment: { token } });
  }

  function handleThreeDSComplete(threeDSResponse: unknown) {
    const request = buildCheckoutRequest();
    if (!request || !pendingTokenRef.current) return;
    confirmThreeDS({ ...request, payment: { token: pendingTokenRef.current } }, threeDSResponse);
  }

  // Empty cart (not after a confirmed order)
  if (items.length === 0 && submitState.phase !== "authorised" && !confirmedOrder) {
    return (
      <main className="flex flex-1 flex-col">
        <AnnouncementBanner />
        <Header />
        <section className="flex-1 bg-cream">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h1 className="font-serif text-3xl font-bold text-navy">Checkout</h1>
            <p className="mt-4 text-sm text-text-light">Your basket is empty.</p>
            <Link
              href="/#shop"
              className="mt-6 inline-block bg-lobster px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lobster/90"
              style={{ borderRadius: "3px" }}
            >
              Shop Today&apos;s Catch
            </Link>
          </div>
        </section>
        <footer className="mt-auto border-t border-border bg-navy">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex items-center justify-between">
              <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
              <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  // Confirmation
  if (submitState.phase === "authorised" && confirmedOrder) {
    return (
      <main className="flex flex-1 flex-col">
        <AnnouncementBanner />
        <Header />
        <section className="flex-1 bg-cream">
          <div className="mx-auto max-w-lg px-6 py-20 text-center">
            <div
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center ${confirmedOrder.isChristmas ? "bg-[#e8f5ed]" : "bg-ocean-light"}`}
              style={{ borderRadius: "50%" }}
            >
              <Check className={`h-8 w-8 ${confirmedOrder.isChristmas ? "text-[#1a3a2a]" : "text-teal"}`} />
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy">
              {confirmedOrder.isChristmas ? "Pre-Order Confirmed!" : "Order Confirmed!"}
            </h1>
            <p className="mt-2 text-xs text-text-light">Order #{submitState.orderNumber}</p>
            <p className="mt-3 text-sm text-text-light">
              {confirmedOrder.itemCount} item{confirmedOrder.itemCount > 1 ? "s" : ""} ·{" "}
              {confirmedOrder.slot.type === "delivery" ? "Delivery" : "Collection"} · £{submitState.estimatedTotal.toFixed(2)} (estimated)
            </p>
            <div className="mt-6 border border-border bg-white p-5 text-left" style={{ borderRadius: "5px" }}>
              <div className="flex items-center gap-2 text-sm font-medium text-navy">
                {confirmedOrder.slot.type === "delivery" ? <Truck className="h-4 w-4 text-teal" /> : <Store className="h-4 w-4 text-teal" />}
                {confirmedOrder.slot.label}
              </div>
              <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
                <Gift className={`mt-0.5 h-4 w-4 shrink-0 ${confirmedOrder.isChristmas ? "text-[#1a3a2a]" : "text-teal"}`} />
                <p className={`text-xs ${confirmedOrder.isChristmas ? "text-[#1a3a2a]/70" : "text-text-light"}`}>
                  {confirmedOrder.isChristmas
                    ? "You haven't been charged yet. We've verified your card and will take payment automatically a few days before delivery, once your order is weighed — no action needed from you."
                    : "You haven't been charged yet. Since fish is priced by weight, we'll confirm the exact final amount once your order is prepared, then take payment for that amount only."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/#shop"
                className="inline-block bg-lobster px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lobster/90"
                style={{ borderRadius: "3px" }}
              >
                Place Another Order
              </Link>
              <p className="text-xs text-text-light">
                Need to order for a different date? Start a new order.
              </p>
              <Link href="/" className="text-xs text-text-light hover:text-navy">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
        <footer className="mt-auto border-t border-border bg-navy">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex items-center justify-between">
              <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
              <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="flex-1 bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-12">
          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => step === "payment" && setStep("delivery")}
              className={`flex items-center gap-2 text-sm font-medium ${step === "delivery" ? "text-navy" : "text-text-light hover:text-navy"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center text-xs font-medium ${step === "payment" ? "bg-teal text-white" : "bg-navy text-white"}`}
                style={{ borderRadius: "50%" }}
              >
                {step === "payment" ? <Check className="h-3.5 w-3.5" /> : "1"}
              </span>
              Delivery
            </button>
            <div className="h-px w-8 bg-border" />
            <span className={`flex items-center gap-2 text-sm font-medium ${step === "payment" ? "text-navy" : "text-text-light"}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center text-xs font-medium ${step === "payment" ? "bg-navy text-white" : "bg-border text-text-light"}`}
                style={{ borderRadius: "50%" }}
              >
                2
              </span>
              Payment
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {step === "delivery" ? (
                <>
                  {/* 1. Standard or Christmas? */}
                  <h2 className="font-serif text-2xl font-bold text-navy">
                    What are you ordering for?
                  </h2>
                  <p className="mt-1 text-sm text-text-light">
                    This helps us show you the right delivery dates.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => { setOrderType("standard"); setSlotType(null); setSelectedSlot(null); }}
                      className={`flex items-center gap-3 border p-5 text-left transition-colors ${orderType === "standard" ? "border-navy bg-navy/5" : "border-border bg-white hover:border-navy/30"}`}
                      style={{ borderRadius: "5px" }}
                    >
                      <Truck className={`h-5 w-5 ${orderType === "standard" ? "text-navy" : "text-text-light"}`} />
                      <div>
                        <p className="text-sm font-medium text-navy">Standard Order</p>
                        <p className="text-xs text-text-light">Next-day delivery or collection</p>
                      </div>
                      {orderType === "standard" && <Check className="ml-auto h-4 w-4 text-navy" />}
                    </button>
                    <button
                      onClick={() => { setOrderType("christmas"); setSlotType(null); setSelectedSlot(null); }}
                      className={`flex items-center gap-3 border p-5 text-left transition-colors ${orderType === "christmas" ? "border-[#1a3a2a] bg-[#e8f5ed]" : "border-[#1a3a2a]/20 bg-[#e8f5ed]/30 hover:border-[#1a3a2a]/40"}`}
                      style={{ borderRadius: "5px" }}
                    >
                      <Gift className={`h-5 w-5 ${orderType === "christmas" ? "text-[#1a3a2a]" : "text-[#1a3a2a]/50"}`} />
                      <div>
                        <p className={`text-sm font-medium ${orderType === "christmas" ? "text-[#1a3a2a]" : "text-navy"}`}>Christmas Pre-Order</p>
                        <p className={`text-xs ${orderType === "christmas" ? "text-[#1a3a2a]/70" : "text-text-light"}`}>Delivery 20th-24th December</p>
                      </div>
                      {orderType === "christmas" && <Check className="ml-auto h-4 w-4 text-[#1a3a2a]" />}
                    </button>
                  </div>

                  {/* 2. Postcode check */}
                  {orderType && (
                    <div className="mt-8 border border-border bg-white p-5" style={{ borderRadius: "5px" }}>
                      <p className="mb-1 text-sm font-medium text-navy">Enter your postcode</p>
                      <p className="mb-3 text-xs text-text-light">We&apos;ll check if we can deliver to you, or you can collect from our shop.</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                          <input
                            type="text"
                            placeholder="e.g. N1 8LU"
                            value={postcode}
                            onChange={(e) => { setPostcode(e.target.value); if (postcodeStatus !== "idle") { setPostcodeStatus("idle"); setSlotType(null); setSelectedSlot(null); } }}
                            onKeyDown={(e) => e.key === "Enter" && handlePostcodeCheck()}
                            className="w-full border border-border bg-white py-2.5 pl-9 pr-4 text-sm text-navy outline-none placeholder:text-text-light/50 focus:border-navy"
                            style={{ borderRadius: "3px" }}
                          />
                        </div>
                        <button
                          onClick={handlePostcodeCheck}
                          className="shrink-0 bg-teal px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal/90"
                          style={{ borderRadius: "3px" }}
                        >
                          Check
                        </button>
                      </div>

                      {postcodeStatus === "valid" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-teal">
                          <CheckCircle className="h-3.5 w-3.5" />
                          We deliver to your area. Choose delivery or collection below.
                        </div>
                      )}
                      {postcodeStatus === "out-of-zone" && (
                        <div className="mt-3 flex items-start gap-1.5 text-xs text-text-light">
                          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                          <span>
                            We don&apos;t currently deliver to your area, but you can collect from <strong>88 Essex Road</strong>. Choose a collection slot below.
                          </span>
                        </div>
                      )}
                      {postcodeStatus === "invalid" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-lobster">
                          <XCircle className="h-3.5 w-3.5" />
                          Please enter a valid UK postcode (e.g. N1 8LU)
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Delivery or collection (only if in zone — out of zone auto-sets collection) */}
                  {postcodeStatus === "valid" && (
                    <>
                      <h2 className="mt-8 font-serif text-2xl font-bold text-navy">
                        Delivery or collection?
                      </h2>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() => { setSlotType("delivery"); setSelectedSlot(null); }}
                          className={`flex items-center gap-3 border p-4 text-left transition-colors ${slotType === "delivery" ? "border-navy bg-navy/5" : "border-border bg-white hover:border-navy/30"}`}
                          style={{ borderRadius: "5px" }}
                        >
                          <Truck className={`h-5 w-5 ${slotType === "delivery" ? "text-navy" : "text-text-light"}`} />
                          <div>
                            <p className="text-sm font-medium text-navy">Delivery</p>
                            <p className="text-xs text-text-light">To {postcode.toUpperCase()} · £5.00</p>
                          </div>
                          {slotType === "delivery" && <Check className="ml-auto h-4 w-4 text-navy" />}
                        </button>
                        <button
                          onClick={() => { setSlotType("collection"); setSelectedSlot(null); }}
                          className={`flex items-center gap-3 border p-4 text-left transition-colors ${slotType === "collection" ? "border-navy bg-navy/5" : "border-border bg-white hover:border-navy/30"}`}
                          style={{ borderRadius: "5px" }}
                        >
                          <Store className={`h-5 w-5 ${slotType === "collection" ? "text-navy" : "text-text-light"}`} />
                          <div>
                            <p className="text-sm font-medium text-navy">Click & Collect</p>
                            <p className="text-xs text-text-light">88 Essex Road · Free</p>
                          </div>
                          {slotType === "collection" && <Check className="ml-auto h-4 w-4 text-navy" />}
                        </button>
                      </div>
                    </>
                  )}

                  {/* 4. Slot picker */}
                  {showSlots && (
                    <>
                      <h2 className="mt-8 font-serif text-2xl font-bold text-navy">
                        {orderType === "christmas" ? "Choose your Christmas slot" : "Choose your slot"}
                      </h2>
                      <p className="mt-1 text-sm text-text-light">
                        {orderType === "christmas"
                          ? "Select your preferred delivery or collection date for Christmas."
                          : slotType === "delivery"
                            ? "Select a delivery date and time."
                            : "Select a collection date."}
                      </p>

                      <div className="mt-4 space-y-1.5">
                        {slots.map((slot, i) => {
                          const isSelected = selectedSlot?.label === slot.label && selectedSlot?.type === slot.type;
                          const isXmas = orderType === "christmas";
                          return (
                            <button
                              key={`${slot.label}-${i}`}
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition-colors ${
                                isSelected
                                  ? isXmas ? "border-[#1a3a2a] bg-[#e8f5ed]" : "border-navy bg-navy/5"
                                  : isXmas ? "border-[#1a3a2a]/20 bg-[#e8f5ed]/30 hover:border-[#1a3a2a]/40" : "border-border bg-white hover:border-navy/30"
                              }`}
                              style={{ borderRadius: "3px" }}
                            >
                              <div className="flex items-center gap-3">
                                {slot.type === "delivery" ? (
                                  <Truck className={`h-4 w-4 ${isSelected ? (isXmas ? "text-[#1a3a2a]" : "text-navy") : (isXmas ? "text-[#1a3a2a]/50" : "text-text-light")}`} />
                                ) : (
                                  <Store className={`h-4 w-4 ${isSelected ? (isXmas ? "text-[#1a3a2a]" : "text-navy") : (isXmas ? "text-[#1a3a2a]/50" : "text-text-light")}`} />
                                )}
                                <span className={isSelected ? (isXmas ? "text-[#1a3a2a]" : "text-navy") : (isXmas ? "text-[#1a3a2a]/70" : "text-text-light")}>
                                  {slot.label}
                                </span>
                              </div>
                              {isSelected && <Check className={`h-4 w-4 ${isXmas ? "text-[#1a3a2a]" : "text-navy"}`} />}
                            </button>
                          );
                        })}
                      </div>

                      {orderType === "christmas" && selectedSlot && (
                        <div className="mt-4 border border-[#1a3a2a]/20 bg-[#e8f5ed] p-4" style={{ borderRadius: "5px" }}>
                          <div className="flex items-start gap-3">
                            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#1a3a2a]" />
                            <div>
                              <p className="text-sm font-medium text-[#1a3a2a]">Christmas Pre-Order</p>
                              <p className="mt-1 text-xs leading-relaxed text-[#1a3a2a]/70">
                                We&apos;ll verify your card now — you won&apos;t be charged today. Payment is taken
                                automatically a few days before delivery, once your order is weighed, with no
                                action needed from you.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Continue to payment */}
                  <button
                    onClick={() => canProceedToPayment && setStep("payment")}
                    disabled={!canProceedToPayment}
                    className={`mt-8 w-full px-6 py-3.5 text-sm font-medium tracking-wide text-white transition-colors md:w-auto ${canProceedToPayment ? "bg-lobster hover:bg-lobster/90" : "cursor-not-allowed bg-gray-300"}`}
                    style={{ borderRadius: "3px" }}
                  >
                    Continue to Payment
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep("delivery")}
                    className="mb-4 flex items-center gap-1 text-sm text-text-light transition-colors hover:text-navy"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change delivery slot
                  </button>

                  {selectedSlot && (
                    <div className="mb-6 flex items-center gap-3 border border-border bg-white px-4 py-3" style={{ borderRadius: "5px" }}>
                      {selectedSlot.type === "delivery" ? <Truck className="h-4 w-4 text-teal" /> : <Store className="h-4 w-4 text-teal" />}
                      <span className="text-sm text-navy">{selectedSlot.label}</span>
                      {isChristmasOrder && (
                        <span className="bg-[#1a3a2a] px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ borderRadius: "2px" }}>
                          Christmas Pre-Order
                        </span>
                      )}
                    </div>
                  )}

                  <h2 className="font-serif text-2xl font-bold text-navy">Your details & payment</h2>
                  <p className="mt-1 text-sm text-text-light">
                    Enter your details to complete your order.
                  </p>

                  <div className="mt-6 border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
                    <ContactAddressForm value={contact} onChange={setContact} showAddress={slotType === "delivery"} />
                  </div>

                  {submitState.phase === "requires_action" ? (
                    <div className="mt-6">
                      <ThreeDSChallenge onComplete={handleThreeDSComplete} />
                    </div>
                  ) : (
                    <div className="mt-6">
                      <p className="mb-2 text-xs font-medium tracking-wide text-navy uppercase">
                        {isChristmasOrder ? "Place Pre-Order" : "Place Order"} · £{(estimatedTotal + deliveryCost).toFixed(2)} (estimated)
                      </p>
                      <PaymentPanel
                        amount={estimatedTotal + deliveryCost}
                        onToken={handleToken}
                        disabled={submitState.phase === "submitting" || submitState.phase === "confirming"}
                      />
                      {!isSignedIn && (
                        <p className="mt-2 text-xs text-text-light">
                          We&apos;ll save your details so you can track this order and sign in next time — no
                          password needed.
                        </p>
                      )}
                    </div>
                  )}

                  {(submitState.phase === "declined" || submitState.phase === "error") && (
                    <div className="mt-4 flex items-start gap-2 border border-lobster/30 bg-lobster/5 p-4" style={{ borderRadius: "5px" }}>
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-lobster" />
                      <div>
                        <p className="text-sm text-navy">
                          {submitState.phase === "declined" ? submitState.reason : submitState.message}
                        </p>
                        <button onClick={resetSubmit} className="mt-1 text-xs text-navy underline">
                          Try again
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-light">
                    <CreditCard className="h-3.5 w-3.5" />
                    Secure payment · Your details are encrypted
                  </div>
                </>
              )}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
              <div className="border border-border bg-white p-6" style={{ borderRadius: "5px" }}>
                <h2 className="font-serif text-lg font-semibold text-navy">Order Summary</h2>

                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-sand" style={{ borderRadius: "3px" }}>
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-medium text-navy">{item.product.name}</p>
                          <p className="text-text-light">{item.preparation}</p>
                        </div>
                        <span className="text-xs font-medium text-navy">£{lineTotal(item).toFixed(2)}</span>
                      </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-text-light">
                    <span>Subtotal</span>
                    <span>£{estimatedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-light">
                    <span>{slotType === "delivery" ? "Delivery" : slotType === "collection" ? "Collection" : "Fulfilment"}</span>
                    <span>{!slotType ? "—" : slotType === "collection" ? "Free" : "£5.00"}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between font-semibold text-navy">
                      <span>Estimated total</span>
                      <span>£{(estimatedTotal + deliveryCost).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border border-ocean/20 bg-ocean-light p-3" style={{ borderRadius: "3px" }}>
                  <p className="text-[11px] leading-relaxed text-navy">
                    <strong>Fair pricing.</strong> Final amount may differ slightly once your order is weighed and prepared.
                  </p>
                </div>

                <Link href="/cart" className="mt-4 block text-center text-xs text-text-light hover:text-navy">
                  ← Back to basket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between">
            <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
