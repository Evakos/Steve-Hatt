import Image from "next/image";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";

export const metadata = {
  title: "Suppliers | Steve Hatt Fishmongers",
  description: "Thoughtfully sourced — how Steve Hatt Fishmongers sources fresh, responsibly caught fish from the British coastline.",
};

export default function SuppliersPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="relative flex items-center bg-navy" style={{ minHeight: "320px" }}>
        <Image src="/suppliers-hero.jpg" alt="" fill className="object-cover" priority />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(15, 23, 42, 0.75) 15%, rgba(15, 23, 42, 0.2) 60%)" }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <p className="mb-4 text-sm tracking-widest text-white/50 uppercase">Suppliers</p>
          <h1 className="font-serif text-4xl font-bold leading-[1.1] text-white md:text-5xl">Thoughtfully Sourced</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">
            We are committed to bringing you the freshest possible fish in the most environmentally friendly way —
            constantly assessing our ecological impact and leading the way on sustainability.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Sourcing Fish</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                We care about where our fish comes from and we won&apos;t settle for less than the very best.
                We&apos;ve been sourcing and preparing fish for over a century — our valued relationships at the
                fish markets and with the fishermen are built on mutual respect, which means we can bring you the
                freshest, high-quality fish, straight from the British coastline and beyond.
              </p>
            </div>
            <div className="relative h-64 overflow-hidden" style={{ borderRadius: "5px" }}>
              <Image src="/suppliers-sourcing.jpg" alt="A whole fresh salmon" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative h-64 overflow-hidden md:order-1" style={{ borderRadius: "5px" }}>
              <Image src="/suppliers-british-coastline.jpg" alt="Brixham harbour, Devon" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy">Best of the British Coastline</h2>
              <p className="mt-4 text-sm leading-relaxed text-text-light">
                The best fish has the shortest and quickest journey possible from ocean to plate. That&apos;s why
                most of our fish comes straight from the dayboats via the coastal markets at Brixham, Newlyn and
                other coastal fishing ports, to be sold to you the very next day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-serif text-2xl font-bold text-navy">Responsibly Sourced</h2>
          <p className="mt-4 text-sm leading-relaxed text-text-light">
            Not only do we want to deliver the best quality fish, but we also aim to have as minimal an impact on
            the ocean and our planet as possible. For this reason, we also supply farmed fish sourced only from
            the very best ocean enclosures around the world. Any fish we purchase in the UK is from RSPCA-monitored
            farms, and outside UK waters, from suppliers under strict EU regulations.
          </p>
        </div>
      </section>

      <section className="bg-ocean-light">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs tracking-widest text-navy/60 uppercase">Case study</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-navy">Salmon from the Faroe Islands</h2>
          <p className="mt-4 text-sm leading-relaxed text-navy/80">
            Salmon is one of the most popular fish we sell, and we simply couldn&apos;t keep up with demand
            without having a negative impact on wild populations — so we turned to our friends in the Faroe
            Islands. The cold North Atlantic currents give these fish farms a near-ideal starting point to raise
            salmon, and their dedication to protecting the environment and providing full traceability for both
            the fish and their feed makes this salmon some of the most responsibly raised seafood available.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
