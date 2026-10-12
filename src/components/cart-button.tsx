"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 text-sm text-text-light transition-colors hover:text-navy"
    >
      <ShoppingBag className="h-4 w-4" />
      {itemCount > 0 && (
        <span
          className="absolute -right-2.5 -top-2 flex h-4 w-4 items-center justify-center bg-lobster text-[10px] font-medium text-white"
          style={{ borderRadius: "50%" }}
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
