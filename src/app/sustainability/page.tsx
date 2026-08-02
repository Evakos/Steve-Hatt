import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";

export const metadata = {
  title: "Sustainability | Steve Hatt Fishmongers",
  description: "Good for you, good for the planet, how Steve Hatt Fishmongers approaches sourcing, plastic use and waste.",
};

export default function SustainabilityPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      {/* Plain white intro — the real site has no photo hero on this page */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-8">
          <p className="text-xs tracking-widest text-text-light uppercase">Sustainability</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-4xl">Fresh Fish for Every Season</h1>
          <p className="mt-4 text-lg leading-relaxed text-text-light">
            Good for you, good for the planet. We believe in supporting a sustainable ecology, bringing the
            freshest fish from the British coastline to the Islington community with the smallest possible
            ecological footprint.
          </p>
        </div>
      </section>

      <section className="relative h-64" style={{ minHeight: "260px" }}>
        <Image src="/sustainability-hero.jpg" alt="Brixham harbour, Devon" fill className="object-cover" />
      </section>

      {/* Three pillars */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-4 text-center sm:grid-cols-3">
            <div className="border border-border p-6" style={{ borderRadius: "5px" }}>
              <p className="font-serif text-lg font-semibold text-navy">Sustainable Sourcing</p>
            </div>
            <div className="border border-border p-6" style={{ borderRadius: "5px" }}>
              <p className="font-serif text-lg font-semibold text-navy">Plastic Use</p>
            </div>
            <div className="border border-border p-6" style={{ borderRadius: "5px" }}>
              <p className="font-serif text-lg font-semibold text-navy">Waste Reduction</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-64 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/sustainability-sourcing.jpg" alt="A fishmonger holding a whole salmon" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Sourcing Fish: Wild vs Farmed</h2>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                Wherever possible, we aim to supply wild fish straight off the dayboats. But as experienced
                fishmongers, we know that in some cases the more ecologically friendly option is to source fish
                from farms instead, that doesn&apos;t mean lowering our standards. Any fish we purchase in the UK
                is from RSPCA-monitored farms, and outside UK waters, from suppliers under strict EU regulations.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                We only source farmed fish from trusted suppliers and sell only what we consider the best of the
                best.{" "}
                <Link href="/suppliers" className="text-navy underline hover:text-lobster">
                  Learn more about our suppliers →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-64 overflow-hidden md:order-1" style={{ borderRadius: "5px" }}>
              <Image src="/sustainability-plastic.jpg" alt="A Steve Hatt reusable bag" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Single-Use Plastic</h2>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                The issue of single-use plastic is a complex one. We&apos;re doing our best to tackle it whilst
                still serving our customers well, after consultation with both our customers and the Royal
                College of Art, we now supply cotton, wax-lined re-usable bags free of charge, and use a heavier
                grade of greaseproof paper to keep your fish fresh on the way home.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                No issue is black and white: we still supply heavy-duty plastic bags where needed, but we&apos;re
                passionate advocates of re-use, and we love it when customers bring along their own Tupperware.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-64 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/sustainability-waste.jpg" alt="Staff preparing fish in store" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Minimising Waste</h2>
              <p className="mt-4 text-lg leading-relaxed text-text-light">
                Selling fresh produce inevitably comes with a waste problem. Years of experience mean we can
                fairly accurately balance supply and demand, but life is anything but predictable. To solve this,
                we&apos;ve connected with local charities to ensure any fish left unsold, or that doesn&apos;t
                quite meet our standards for sale, doesn&apos;t get thrown away. Instead, it goes to those in
                need. Good for our customers, good for our community, good for our planet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="text-xs tracking-widest text-white/50 uppercase">Let&apos;s talk</p>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Understanding the best way to protect our planet is a complex and evolving issue. We welcome
            conversation around it and are constantly looking for ways to improve and adapt.{" "}
            <Link href="/contact" className="text-white underline hover:text-white/70">
              Get in touch →
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
