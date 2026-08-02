"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Package, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/guide", label: "Guide", icon: BookOpen },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-navy px-4 py-6">
      <div className="px-2">
        <p className="font-serif text-lg font-bold text-white">Steve Hatt</p>
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
              style={{ borderRadius: "5px" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
