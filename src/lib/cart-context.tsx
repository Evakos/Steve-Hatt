"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { Product } from "./products";
import { computeUnitPriceForOrder } from "./pricing";
import { hasUpcomingChristmasDates } from "./christmas-dates";

const STORAGE_KEY = "steve-hatt-cart";
const ORDER_TYPE_KEY = "steve-hatt-order-type";

export type OrderType = "standard" | "christmas";

function loadStoredItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight: number;
  preparation: string;
  /** True per-unit price (not a line total) - multiply by quantity for the line total, see `lineTotal()`. */
  unitPrice: number;
  /** WooCommerce variation id, if a size option was selected - needed to reprice/order this line at checkout. */
  wooVariationId?: number;
}

/** Line total for a cart item - `unitPrice` is always per-unit, never pre-multiplied by quantity. */
export function lineTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

/**
 * The per-unit price for an order of the given kind. The same rules the server uses at checkout
 * (computeUnitPriceForOrder): on a Christmas order a product or size's manual Christmas price
 * replaces the normal one where it has one. Shop and product pages always show the normal price.
 */
export function orderUnitPrice(item: CartItem, isChristmas: boolean): number {
  const size = item.wooVariationId ? item.product.sizeOptions?.find((s) => s.wooVariationId === item.wooVariationId) : undefined;
  return computeUnitPriceForOrder(
    {
      pricePerKg: item.product.pricePerKg,
      price: item.product.price,
      sizeOptionPrice: item.wooVariationId ? item.unitPrice : undefined,
      sizeOptionChristmasPrice: size?.christmasPrice,
      christmasPrice: item.product.christmasPrice,
    },
    item.weight,
    isChristmas
  );
}

export function orderLineTotal(item: CartItem, isChristmas: boolean): number {
  return Math.round(orderUnitPrice(item, isChristmas) * item.quantity * 100) / 100;
}

/** Why the basket can't be a Christmas order, if something in it is opted out of Christmas. */
export function christmasBlockedMessage(items: CartItem[]): string | null {
  const ineligible = items.filter((item) => item.product.excludedFromChristmas);
  if (ineligible.length === 0) return null;
  return `${ineligible.map((item) => item.product.name).join(", ")} ${ineligible.length === 1 ? "isn't" : "aren't"} available for Christmas delivery, please remove ${ineligible.length === 1 ? "it" : "them"} to order for Christmas.`;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  estimatedTotal: number;
  /** Standard or Christmas, chosen in the basket or at checkout. Null until chosen while Christmas ordering is on. */
  orderType: OrderType | null;
  setOrderType: (type: OrderType | null) => void;
  /** Whether Christmas pre-ordering is on right now, so the choice is offered at all. */
  christmasAvailable: boolean;
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Starts empty so server and first client render match (localStorage isn't available during
  // SSR) - the real cart loads in immediately after mount, in the effect below.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [orderType, setOrderTypeState] = useState<OrderType | null>(null);
  const [christmasAvailable, setChristmasAvailable] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const miniCartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(loadStoredItems());
    try {
      const stored = localStorage.getItem(ORDER_TYPE_KEY);
      if (stored === "standard" || stored === "christmas") setOrderTypeState(stored);
    } catch {}
    setHydrated(true);
  }, []);

  // Whether Christmas ordering is on, the same rule the checkout uses. When it isn't, every order is
  // a standard one and any earlier Christmas choice is dropped, so old prices can't linger.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { active?: boolean; slotsEnabled?: boolean } | null) => {
        if (cancelled) return;
        const available = (data?.active ?? false) && hasUpcomingChristmasDates() && data?.slotsEnabled !== false;
        setChristmasAvailable(available);
        if (!available) setOrderTypeState("standard");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setOrderType = useCallback((type: OrderType | null) => {
    setOrderTypeState(type);
    try {
      if (type) localStorage.setItem(ORDER_TYPE_KEY, type);
      else localStorage.removeItem(ORDER_TYPE_KEY);
    } catch {}
  }, []);

  // `hydrated` (state, not a ref) is what makes this safe: on the mount render this effect sees
  // hydrated=false from *that* render's closure and skips, so the empty initial items never
  // overwrites a previous session's saved cart in localStorage before the load above completes.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
    if (miniCartTimer.current) clearTimeout(miniCartTimer.current);
    setMiniCartOpen(true);
    miniCartTimer.current = setTimeout(() => setMiniCartOpen(false), 5000);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isChristmasOrder = orderType === "christmas";
  const estimatedTotal = items.reduce((sum, item) => sum + orderLineTotal(item, isChristmasOrder), 0);

  return (
    <CartContext value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, estimatedTotal, orderType, setOrderType, christmasAvailable, miniCartOpen, setMiniCartOpen }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
