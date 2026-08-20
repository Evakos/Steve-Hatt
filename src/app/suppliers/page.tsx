import Image from "next/image";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import InnerPageHero from "@/components/inner-page-hero";

export const metadata = {
  title: "Suppliers | Steve Hatt Fishmongers",
  description: "Thoughtfully sourced, how Steve Hatt Fishmongers sources fresh, responsibly caught fish from the British coastline.",
};

export default function SuppliersPage() {
  const cards = [
    {
      image: "/suppliers-sourcing.jpg",
      alt: "A whole fresh salmon",
      eyebrow: "Our sourcing",
      title: "Sourcing Fish",
      body: "We care about where our fish comes from and we won't settle for less than the very best. We've been sourcing and preparing fish for over a century, our valued relationships at the fish markets and with the fishermen are built on mutual respect, which means we can bring you the freshest, high-quality fish, straight from the British coastline and beyond.",
      tag: "Our Sourcing",
    },
    {
      image: "/suppliers-british-coastline.jpg",
      alt: "Brixham harbour, Devon",
      eyebrow: "Fresh daily",
      title: "Best of the British Coastline",
      body: "The best fish has the shortest and quickest journey possible from ocean to plate. That's why most of our fish comes straight from the dayboats via the coastal markets at Brixham, Newlyn and other coastal fishing ports, to be sold to you the very next day.",
      tag: "Coastal Markets",
    },
    {
      eyebrow: "Our approach",
      title: "Responsibly Sourced",
      body: "Not only do we want to deliver the best quality fish, but we also aim to have as minimal an impact on the ocean and our planet as possible. For this reason, we also supply farmed fish sourced only from the very best ocean enclosures around the world. Any fish we purchase in the UK is from RSPCA-monitored farms, and outside UK waters, from suppliers under strict EU regulations.",
      tag: "Responsibly Sourced",
    },
    {
      placeholder: true,
      eyebrow: "Case study",
      title: "Salmon from the Faroe Islands",
      body: "Salmon is one of the most popular fish we sell, and we simply couldn't keep up with demand without having a negative impact on wild populations, so we turned to our friends in the Faroe Islands. The cold North Atlantic currents give these fish farms a near-ideal starting point to raise salmon, and their dedication to protecting the environment and providing full traceability makes this salmon some of the most responsibly raised seafood available.",
      tag: "Read More",
    },
  ];

  const renderCard = (card: (typeof cards)[number], imageHeight: string, sizes: string) => (
    <div key={card.title} className="flex flex-col overflow-hidden bg-white shadow-sm" style={{ borderRadius: "8px" }}>
      {"image" in card && card.image && (
        <div className={`relative ${imageHeight} overflow-hidden`}>
          <Image src={card.image} alt={card.alt ?? ""} fill sizes={sizes} className="object-cover" />
        </div>
      )}
      {"placeholder" in card && (
        <div className={`flex ${imageHeight} items-center justify-center bg-sand`}>
          <span className="text-xs tracking-widest text-text-light uppercase">Image coming soon</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs tracking-widest text-text-light uppercase">{card.eyebrow}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-navy">{card.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-text-light">{card.body}</p>
        <span
          className="mt-4 inline-block self-start border border-navy/30 px-4 py-2 text-xs font-medium tracking-widest text-navy uppercase"
          style={{ borderRadius: "3px" }}
        >
          {card.tag}
        </span>
      </div>
    </div>
  );

  const [first, ...rest] = cards;

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <InnerPageHero
        image="/suppliers-hero.jpg"
        eyebrow="Suppliers"
        title="Thoughtfully Sourced"
        subtitle="From the British Coastline"
      />

      {/* Story cards - pulled up over the hero, matching the About page layout */}
      <section className="bg-white">
        <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-6 pb-16 md:-mt-32">
          <div className="space-y-8">
            {renderCard(first, "h-64 md:h-80", "(max-width: 768px) 100vw, 90vw")}
            <div className="grid gap-8 md:grid-cols-3">{rest.map((card) => renderCard(card, "h-56", "(max-width: 768px) 100vw, 33vw"))}</div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
