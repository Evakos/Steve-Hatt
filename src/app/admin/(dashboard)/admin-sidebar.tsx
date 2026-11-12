"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Package, BookOpen, CalendarDays, ExternalLink, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/slots", label: "Delivery slots", icon: CalendarDays },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/guide", label: "Guide", icon: BookOpen },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-navy px-4 py-6">
      <div className="px-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Open the website's front page"
          className="block font-serif text-lg font-bold text-white hover:underline"
        >
          Steve Hatt
        </a>
        <p className="text-xs tracking-widest text-white/50 uppercase">Admin</p>
      </div>
      <nav className="mt-8 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                active ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              style={{ borderRadius: "6px" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <div className="mt-3 border-t border-white/10 pt-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            style={{ borderRadius: "6px" }}
          >
            <ExternalLink className="h-4 w-4" />
            View website
          </a>
        </div>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          style={{ borderRadius: "6px" }}
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
