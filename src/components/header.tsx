"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Menu, X } from "lucide-react";
import CartButton from "./cart-button";
import MiniCart from "./mini-cart";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#how", label: "How It Works" },
  { href: "/#story", label: "Our Story" },
  { href: "/blog", label: "Recipes & News" },
];

/** A section link is only "current" when it points at a real page (not an in-page #anchor) and the
 * visitor is on it - Home matches the front page exactly, the others match their whole section. */
function isCurrent(href: string, pathname: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Nav link with a coral underline that grows in on hover and stays on for the current page. */
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative py-1 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lobster ${
        active ? "font-medium text-navy" : "text-text-light hover:text-navy"
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-lobster transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-border/50 bg-white sticky top-0 z-50">
      <nav className="grid h-20 w-full grid-cols-2 items-center px-6 md:grid-cols-3">
        <Link href="/" className="justify-self-start">
          <Image src="/logo.svg" alt="Steve Hatt Fishmongers" width={180} height={80} className="h-11 w-auto" priority />
        </Link>

        {/* Desktop nav - centered links */}
        <div className="hidden items-center justify-self-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} active={isCurrent(l.href, pathname)}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center justify-self-end gap-8 md:flex">
          {/* Account link - /account redirects to sign-in if not authenticated */}
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-base text-text-light transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lobster"
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
            className="bg-lobster px-5 py-2.5 text-base font-medium text-white transition-all hover:-translate-y-px hover:bg-[#e2573b] hover:shadow-md active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lobster"
            style={{ borderRadius: "6px" }}
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
            {NAV_LINKS.map((l) => {
              const active = isCurrent(l.href, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-l-2 py-1 pl-3 text-base transition-colors ${
                    active
                      ? "border-lobster font-medium text-navy"
                      : "border-transparent text-text-light hover:border-lobster/50 hover:text-navy"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
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
              style={{ borderRadius: "6px" }}
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
