import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Recipes & News" },
  { href: "/contact", label: "Contact" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/recruitment", label: "Recruitment" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
];

/** Shared bottom nav bar used across every page — the homepage additionally shows its own
 * "Opening hours / Visit us / Delivery zones" section directly above this, which isn't part of
 * this shared component since it's homepage-specific content, not site-wide chrome. */
export default function Footer() {
  return (
    <footer className="border-t border-border bg-navy">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            {footerLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-white/70">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-6 text-xs text-white/40">&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
      </div>
    </footer>
  );
}
