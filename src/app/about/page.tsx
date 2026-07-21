import Image from "next/image";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import InnerPageHero from "@/components/inner-page-hero";

export const metadata = {
  title: "About | Steve Hatt Fishmongers",
  description: "Setting standards since 1895 — the story of Steve Hatt Fishmongers, Islington's local fish shop.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <InnerPageHero
        image="/heritage-shop-front.jpg"
        eyebrow="About"
        title="Setting Standards Since 1895"
        subtitle="Serving the Local Community"
      />

      {/* Intro */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg leading-relaxed text-text-light">
            For over 130 years, our fish shop has been an integral part of the Islington community. Things have
            changed a bit over the years, but we&apos;re just as committed to providing the freshest, high-quality
            fish to our customers whilst adhering to strong ethical guidelines as we ever were.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-72 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/heritage-team.jpg" alt="The Steve Hatt team at work" fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs tracking-widest text-text-light uppercase">Our team</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-navy">A Family Business</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                Behind the counter is a small team of experienced fishmongers who know their fish inside and out —
                many of whom have been part of the shop for years. It&apos;s their knowledge, built up over
                decades of early mornings and market runs, that means every piece of fish is handled with the care
                it deserves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for excellence */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs tracking-widest text-text-light uppercase">Our shop</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-navy">Designed for Excellence</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                Ever wondered why our shop doesn&apos;t smell a bit &ldquo;fishy&rdquo; like other fishmongers do?
                It&apos;s because we&apos;re designed not to. When our building burnt down in 2007, we were able to
                design the perfect environment for storing and selling fish from the ground up — from drainage
                below ground, to airflow above ground.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                With controllable airflow, purpose-built stainless steel counters and optimum refrigeration
                conditions, there&apos;s a lot more to our humble shop than meets the eye.
              </p>
            </div>
            <div className="relative h-72 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/heritage-fresh-catch.jpg" alt="A whole fresh fish laid on ice" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Adapted for change */}
      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs tracking-widest text-white/50 uppercase">Adapted for change</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-white">130 Years Isn&apos;t By Chance</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Working in the fish industry means fighting the current — only the strongest survive. For us, that
            comes down to a passion for what we do and a willingness to adapt: from a corner shop on Essex Road to
            an online fishmonger delivering across Islington, the same fish and the same standards, just more
            convenient.
          </p>
        </div>
      </section>

      {/* Hours + visit */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Opening Hours</h3>
              <div className="space-y-2 text-sm text-text-light">
                <p>Tuesday - Saturday: 7am - 5pm</p>
                <p>Sunday: Closed</p>
                <p>Monday: Closed</p>
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Visit Us</h3>
              <p className="text-sm text-text-light">88 Essex Road<br />Islington, London<br />N1 8LU</p>
              <p className="mt-2 text-sm text-text-light">
                <a href="tel:+442072263963" className="transition-colors hover:text-navy">020 7226 3963</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
