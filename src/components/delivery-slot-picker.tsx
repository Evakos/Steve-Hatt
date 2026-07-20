"use client";

import { useState, useMemo } from "react";
import { Truck, Store, Calendar, Gift, X, Check, Snowflake } from "lucide-react";
import type { Product } from "@/lib/products";

type SlotType = "delivery" | "collection";

interface Slot {
  date: Date;
  label: string;
  type: SlotType;
  isPreOrder?: boolean;
  preOrderDelivery?: string;
  available: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function getNextWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from tomorrow
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    // Skip Sundays and Mondays (shop closed)
    if (d.getDay() !== 0 && d.getDay() !== 1) {
      dates.push(d);
    }
  }
  return dates;
}

function isChristmasPeriod(date: Date): boolean {
  const m = date.getMonth();
  const d = date.getDate();
  // 20th-24th December
  return m === 11 && d >= 20 && d <= 24;
}

function isChristmasSlot(date: Date): boolean {
  const m = date.getMonth();
  const d = date.getDate();
  // 23rd-24th December specifically
  return m === 11 && (d === 23 || d === 24);
}

interface Props {
  product: Product;
  onClose: () => void;
  onConfirm: (slot: Slot) => void;
}

export default function DeliverySlotPicker({ product, onClose, onConfirm }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const slots = useMemo(() => {
    const dates = getNextWeekDates();
    const result: Slot[] = [];

    dates.forEach((date) => {
      const isChristmas = isChristmasSlot(date);
      const isPreOrderPeriod = isChristmasPeriod(date);

      // Delivery slots (morning and afternoon)
      result.push({
        date,
        label: `${formatDate(date)} · Morning (9am-12pm)`,
        type: "delivery",
        isPreOrder: isChristmas,
        preOrderDelivery: isChristmas ? "Delivered 23rd-24th December" : undefined,
        available: true,
      });

      result.push({
        date,
        label: `${formatDate(date)} · Afternoon (12pm-5pm)`,
        type: "delivery",
        isPreOrder: isChristmas,
        preOrderDelivery: isChristmas ? "Delivered 23rd-24th December" : undefined,
        available: true,
      });

      // Collection slot
      result.push({
        date,
        label: `${formatDate(date)} · Collection (7am-5pm)`,
        type: "collection",
        isPreOrder: false,
        available: true,
      });
    });

    return result;
  }, []);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    setConfirmed(true);
    onConfirm(selectedSlot);
  };

  if (confirmed && selectedSlot) {
    const isChristmas = selectedSlot.isPreOrder;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md bg-white p-8 shadow-xl" style={{ borderRadius: '5px' }}>
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center ${isChristmas ? 'bg-[#e8f5ed]' : 'bg-ocean-light'}`} style={{ borderRadius: '50%' }}>
              <Check className={`h-7 w-7 ${isChristmas ? 'text-[#1a3a2a]' : 'text-teal'}`} />
            </div>
            <h3 className="font-serif text-xl font-bold text-navy">
              {isChristmas ? "Pre-Order Confirmed!" : "Added to Order"}
            </h3>
            <p className="mt-2 text-sm text-text-light">
              {product.name}
            </p>
            <div className="mt-4 border border-border bg-cream p-4 text-left text-sm" style={{ borderRadius: '3px' }}>
              <div className="flex items-center gap-2 text-navy">
                {selectedSlot.type === "delivery" ? (
                  <Truck className="h-4 w-4 text-teal" />
                ) : (
                  <Store className="h-4 w-4 text-teal" />
                )}
                <span className="font-medium">{selectedSlot.type === "delivery" ? "Delivery" : "Collection"}</span>
              </div>
              <p className="mt-1 text-text-light">{selectedSlot.label}</p>

              {isChristmas && (
                <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3a2a]" />
                  <div>
                    <p className="font-medium text-[#1a3a2a]">Christmas Pre-Order</p>
                    <p className="mt-0.5 text-xs text-[#1a3a2a]/70">
                      We&apos;ll verify your card now — you won&apos;t be charged today. Payment is taken automatically a few days before delivery, once your order is weighed, with no action needed from you.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90"
              style={{ borderRadius: '3px' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white shadow-xl" style={{ borderRadius: '5px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-navy">Choose your slot</h3>
            <p className="text-xs text-text-light">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pre-order info banner */}
        {product.featuredFor?.includes("christmas") && (
          <div className="mx-6 mt-4 border border-[#1a3a2a]/20 bg-[#e8f5ed] p-3" style={{ borderRadius: '3px' }}>
            <div className="flex items-start gap-2">
              <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3a2a]" />
              <div>
                <p className="text-xs font-medium text-[#1a3a2a]">Christmas Pre-Order Available</p>
                <p className="mt-0.5 text-[11px] text-[#1a3a2a]/70">
                  Select a delivery slot on 23rd-24th December for Christmas delivery. Or choose any other date for a regular order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slot type tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedSlot?.type === "delivery" || !selectedSlot
                  ? "bg-navy text-white"
                  : "border border-border text-navy hover:border-navy"
              }`}
              style={{ borderRadius: '3px' }}
              onClick={() => {
                const firstDelivery = slots.find((s) => s.type === "delivery");
                if (firstDelivery) setSelectedSlot(firstDelivery);
              }}
            >
              <Truck className="h-4 w-4" />
              Delivery
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                selectedSlot?.type === "collection"
                  ? "bg-navy text-white"
                  : "border border-border text-navy hover:border-navy"
              }`}
              style={{ borderRadius: '3px' }}
              onClick={() => {
                const firstCollection = slots.find((s) => s.type === "collection");
                if (firstCollection) setSelectedSlot(firstCollection);
              }}
            >
              <Store className="h-4 w-4" />
              Collection
            </button>
          </div>
        </div>

        {/* Slot list */}
        <div className="max-h-64 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            {slots
              .filter((s) => !selectedSlot || s.type === selectedSlot.type)
              .map((slot, i) => {
                const isSelected = selectedSlot?.label === slot.label && selectedSlot?.type === slot.type;
                const isChristmas = slot.isPreOrder;

                return (
                  <button
                    key={`${slot.label}-${slot.type}-${i}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-navy bg-navy/5"
                        : "border-border hover:border-navy/30"
                    }`}
                    style={{ borderRadius: '3px' }}
                  >
                    <div className="flex items-center gap-3">
                      {slot.type === "delivery" ? (
                        <Truck className={`h-4 w-4 ${isSelected ? 'text-navy' : 'text-text-light'}`} />
                      ) : (
                        <Store className={`h-4 w-4 ${isSelected ? 'text-navy' : 'text-text-light'}`} />
                      )}
                      <div>
                        <span className={isSelected ? "text-navy" : "text-text-light"}>{slot.label}</span>
                        {isChristmas && (
                          <span className="ml-2 inline-block bg-[#1a3a2a] px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ borderRadius: '2px' }}>
                            Pre-order
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-navy" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Selected slot info */}
        {selectedSlot && selectedSlot.isPreOrder && (
          <div className="mx-6 mb-2 border border-[#1a3a2a]/20 bg-[#e8f5ed] p-3" style={{ borderRadius: '3px' }}>
            <div className="flex items-start gap-2">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3a2a]" />
              <div>
                <p className="text-xs font-medium text-[#1a3a2a]">Christmas Pre-Order</p>
                <p className="mt-0.5 text-[11px] text-[#1a3a2a]/70">
                  We&apos;ll verify your card now — you won&apos;t be charged today. Payment is taken automatically a few days before delivery, once your order is weighed, with no action needed from you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Freezing notice */}
        {selectedSlot && !selectedSlot.isPreOrder && product.featuredFor?.includes("christmas") && (
          <div className="mx-6 mb-2 border border-ocean/20 bg-ocean-light p-3" style={{ borderRadius: '3px' }}>
            <div className="flex items-start gap-2">
              <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <div>
                <p className="text-xs font-medium text-navy">Planning ahead?</p>
                <p className="mt-0.5 text-[11px] text-text-light">
                  This item freezes well. Order now for a regular delivery slot and freeze until Christmas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirm button */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot}
            className={`w-full px-6 py-3 text-sm font-medium text-white transition-colors ${
              selectedSlot
                ? "bg-lobster hover:bg-lobster/90"
                : "cursor-not-allowed bg-gray-300"
            }`}
            style={{ borderRadius: '3px' }}
          >
            {selectedSlot?.isPreOrder
              ? "Confirm Pre-Order"
              : "Add to Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
