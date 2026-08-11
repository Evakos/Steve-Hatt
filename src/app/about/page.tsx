import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import InnerPageHero from "@/components/inner-page-hero";

export const metadata = {
  title: "About | Steve Hatt Fishmongers",
  description: "Setting standards since 1895, the story of Steve Hatt Fishmongers, Islington's local fish shop.",
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <InnerPageHero
        image="/hero.svg"
        eyebrow="About"
        title="Setting Standards Since 1895"
        subtitle="Serving the Local Community"
      />

      {/* Story cards — pulled up over the hero, like the "About Alor" reference layout */}
      <section className="bg-white">
        <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-6 pb-16 md:-mt-32">
          {(() => {
            const cards = [
              {
                image: "/heritage-shop-front.jpg",
                alt: "The Steve Hatt shop front today at 88 Essex Road",
                eyebrow: "Our story",
                title: "130 Years in Islington",
                body: (
                  <>
                    <strong className="text-navy">For over 130 years</strong>, our fish shop has been an integral
                    part of the Islington community. Things have changed a bit over the years, but we&apos;re just
                    as committed to providing the freshest, high-quality fish to our customers whilst adhering to
                    strong ethical guidelines as we ever were.
                  </>
                ),
                tag: "Our Heritage",
              },
              {
                image: "/heritage-team.jpg",
                alt: "The Steve Hatt team at work",
                eyebrow: "Our team",
                title: "A Family Business",
                body: "Behind the counter is a small team of experienced fishmongers who know their fish inside and out, many of whom have been part of the shop for years. It's their knowledge, built up over decades of early mornings and market runs, that means every piece of fish is handled with the care it deserves.",
                tag: "Meet the Team",
              },
              {
                eyebrow: "Our shop",
                title: "Designed for Excellence",
                body: "Ever wondered why our shop doesn't smell a bit \"fishy\" like other fishmongers do? It's because we're designed not to. When our building burnt down in 2007, we were able to design the perfect environment for storing and selling fish from the ground up, from drainage below ground, to airflow above ground, with controllable airflow, purpose-built stainless steel counters and optimum refrigeration.",
                tag: "Our Shop",
              },
              {
                placeholder: true,
                eyebrow: "Adapted for change",
                title: "130 Years Isn't By Chance",
                body: "Working in the fish industry means fighting the current, only the strongest survive. For us, that comes down to a passion for what we do and a willingness to adapt: from a corner shop on Essex Road to an online fishmonger delivering across Islington, the same fish and the same standards, just more convenient.",
                tag: "Order Online",
                href: "/shop",
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
                  {card.href ? (
                    <Link
                      href={card.href}
                      className="mt-4 inline-block self-start border border-navy/30 px-4 py-2 text-xs font-medium tracking-widest text-navy uppercase transition-colors hover:bg-navy/5"
                      style={{ borderRadius: "3px" }}
                    >
                      {card.tag}
                    </Link>
                  ) : (
                    <span
                      className="mt-4 inline-block self-start border border-navy/30 px-4 py-2 text-xs font-medium tracking-widest text-navy uppercase"
                      style={{ borderRadius: "3px" }}
                    >
                      {card.tag}
                    </span>
                  )}
                </div>
              </div>
            );

            const [first, ...rest] = cards;

            return (
              <div className="space-y-8">
                {renderCard(first, "h-64 md:h-80", "(max-width: 768px) 100vw, 90vw")}
                <div className="grid gap-8 md:grid-cols-3">{rest.map((card) => renderCard(card, "h-56", "(max-width: 768px) 100vw, 33vw"))}</div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Hours + visit */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Opening Hours</h3>
              <div className="space-y-2 text-base text-text-light">
                <p>Tuesday - Saturday: 7am - 5pm</p>
                <p>Sunday: Closed</p>
                <p>Monday: Closed</p>
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Visit Us</h3>
              <p className="text-base text-text-light">88 Essex Road<br />Islington, London<br />N1 8LU</p>
              <p className="mt-2 text-base text-text-light">
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
