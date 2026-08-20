"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Menu, X } from "lucide-react";
import CartButton from "./cart-button";
import MiniCart from "./mini-cart";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-border/50 bg-white sticky top-0 z-50">
      <nav className="grid h-20 w-full grid-cols-2 items-center px-6 md:grid-cols-3">
        <Link href="/" className="justify-self-start">
          <Image src="/logo.svg" alt="Steve Hatt Fishmongers" width={180} height={80} className="h-11 w-auto" priority />
        </Link>

        {/* Desktop nav - centered links */}
        <div className="hidden items-center justify-self-center gap-8 md:flex">
          <Link href="/shop" className="text-base text-text-light transition-colors hover:text-navy">Shop</Link>
          <Link href="/#how" className="text-base text-text-light transition-colors hover:text-navy">How It Works</Link>
          <Link href="/#story" className="text-base text-text-light transition-colors hover:text-navy">Our Story</Link>
          <Link href="/blog" className="text-base text-text-light transition-colors hover:text-navy">Recipes & News</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-self-end gap-8 md:flex">
          {/* Account link - /account redirects to sign-in if not authenticated */}
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-base text-text-light transition-colors hover:text-navy"
          >
            <User className="h-4 w-4" />
            Account
          </Link>

          <div className="relative">
            <CartButton />
            <MiniCart />
          </div>

          <Link
            href="/shop"
            className="bg-lobster px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-lobster/90"
            style={{ borderRadius: "3px" }}
          >
            Order Online
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="justify-self-end md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6 text-navy" /> : <Menu className="h-6 w-6 text-navy" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-white px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            <Link href="/shop" className="text-base text-text-light hover:text-navy" onClick={() => setMobileOpen(false)}>Shop</Link>
            <Link href="/#how" className="text-base text-text-light hover:text-navy" onClick={() => setMobileOpen(false)}>How It Works</Link>
            <Link href="/#story" className="text-base text-text-light hover:text-navy" onClick={() => setMobileOpen(false)}>Our Story</Link>
            <Link href="/blog" className="text-base text-text-light hover:text-navy" onClick={() => setMobileOpen(false)}>Recipes & News</Link>
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-base text-text-light hover:text-navy"
              onClick={() => setMobileOpen(false)}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
            <div className="relative">
              <CartButton />
              <MiniCart />
            </div>
            <Link
              href="/shop"
              className="inline-block bg-lobster px-5 py-2.5 text-center text-base font-medium text-white hover:bg-lobster/90"
              style={{ borderRadius: "3px" }}
              onClick={() => setMobileOpen(false)}
            >
              Order Online
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
