import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";

const shopLinks = [
  { href: "/shop", label: "Shop all fish" },
  { href: "/#how", label: "How it works" },
  { href: "/blog", label: "Recipes & News" },
  { href: "/sustainability", label: "Sustainability" },
];

const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/suppliers", label: "Our suppliers" },
  { href: "/contact", label: "Contact" },
  { href: "/recruitment", label: "Recruitment" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
];

const hours = [
  { days: "Tuesday to Friday", time: "8am to 7pm" },
  { days: "Saturday", time: "7am to 5pm" },
  { days: "Sunday and Monday", time: "Closed" },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-widest text-white/50 uppercase">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-block text-white/70 transition-all hover:translate-x-0.5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lobster"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shared footer used across every page - the homepage additionally shows its own
 * "Opening hours / Visit us / Delivery zones" section directly above this, which isn't part of
 * this shared component since it's homepage-specific content, not site-wide chrome. */
export default function Footer() {
  return (
    <footer className="bg-navy">
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-9 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Islington&apos;s fishmonger since 1895. Fresh British fish, prepared to order, for collection or delivery.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block bg-lobster px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[#e2573b] hover:shadow-md active:translate-y-0"
              style={{ borderRadius: "6px" }}
            >
              Order online
            </Link>
          </div>

          <LinkColumn title="Shop" links={shopLinks} />
          <LinkColumn title="Company" links={companyLinks} />

          <div>
            <h3 className="text-xs font-medium tracking-widest text-white/50 uppercase">Visit us</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                <span>88-89 Essex Road, Islington, London N1 8LU</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                <a href="tel:+442072263963" className="transition-colors hover:text-white">
                  020 7226 3963
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
                <dl className="space-y-1">
                  {hours.map((h) => (
                    <div key={h.days} className="flex justify-between gap-4">
                      <dt>{h.days}</dt>
                      <dd className="text-white/90">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-white/80">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
