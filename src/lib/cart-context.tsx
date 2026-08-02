"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { Product } from "./products";

const STORAGE_KEY = "steve-hatt-cart";
const MODE_STORAGE_KEY = "steve-hatt-cart-mode";

export type CartMode = "standard" | "christmas";

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

function loadStoredMode(): CartMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    return raw === "christmas" ? "christmas" : "standard";
  } catch {
    return "standard";
  }
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight: number;
  preparation: string;
  /** True per-unit price (not a line total) — multiply by quantity for the line total, see `lineTotal()`. */
  unitPrice: number;
  /** WooCommerce variation id, if a size option was selected — needed to reprice/order this line at checkout. */
  wooVariationId?: number;
}

/** Line total for a cart item — `unitPrice` is always per-unit, never pre-multiplied by quantity. */
export function lineTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

/** Almost every product is Christmas-eligible by default — only explicitly excluded ones aren't. */
export function isEligibleForMode(product: Product, mode: CartMode): boolean {
  if (mode === "christmas") return !product.excludedFromChristmas;
  return true;
}

interface CartContextValue {
  items: CartItem[];
  mode: CartMode;
  /** Switches the cart's mode. Fails (returns false, cart unchanged) if switching to "christmas"
   * while the cart already holds an item that's excluded from Christmas pre-orders — the caller
   * should have the customer remove/clear those first rather than silently dropping them. */
  setMode: (mode: CartMode) => boolean;
  /** Fails (returns false, cart unchanged) if the item isn't eligible for the cart's current mode
   * — callers (add-to-cart UI) should disable adding in that case rather than relying on this. */
  addItem: (item: Omit<CartItem, "id">) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  estimatedTotal: number;
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Starts empty so server and first client render match (localStorage isn't available during
  // SSR) — the real cart loads in immediately after mount, in the effect below.
  const [items, setItems] = useState<CartItem[]>([]);
  const [mode, setModeState] = useState<CartMode>("standard");
  const [hydrated, setHydrated] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const miniCartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(loadStoredItems());
    setModeState(loadStoredMode());
    setHydrated(true);
  }, []);

  // `hydrated` (state, not a ref) is what makes this safe: on the mount render this effect sees
  // hydrated=false from *that* render's closure and skips, so the empty initial items never
  // overwrites a previous session's saved cart in localStorage before the load above completes.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    if (!isEligibleForMode(item.product, mode)) return false;
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
    if (miniCartTimer.current) clearTimeout(miniCartTimer.current);
    setMiniCartOpen(true);
    miniCartTimer.current = setTimeout(() => setMiniCartOpen(false), 5000);
    return true;
  }, [mode]);

  const setMode = useCallback((newMode: CartMode) => {
    if (newMode === "christmas") {
      const hasIneligibleItem = items.some((item) => !isEligibleForMode(item.product, "christmas"));
      if (hasIneligibleItem) return false;
    }
    setModeState(newMode);
    return true;
  }, [items]);

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

  const estimatedTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  return (
    <CartContext
      value={{
        items,
        mode,
        setMode,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        estimatedTotal,
        miniCartOpen,
        setMiniCartOpen,
      }}
    >
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
