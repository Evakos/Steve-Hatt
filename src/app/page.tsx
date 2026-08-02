import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { Truck, Fish, Scaling, Leaf, Anchor, Recycle, ShoppingBag, Search } from "lucide-react";
import Header from "@/components/header";
import PostcodeCheck from "@/components/postcode-check";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";

const howItWorks = [
  { icon: <ShoppingBag className="h-5 w-5" />, step: "01", title: "Browse & Order", desc: "Our stock is updated daily based on what's come in fresh. Select your fish and approximate weight." },
  { icon: <Search className="h-5 w-5" />, step: "02", title: "Postcode Check", desc: "Enter your postcode. We deliver locally across Islington, or choose click & collect." },
  { icon: <Fish className="h-5 w-5" />, step: "03", title: "We Prepare", desc: "Your fishmonger fillets, trims and weighs your order. You only pay for what you receive." },
  { icon: <Truck className="h-5 w-5" />, step: "04", title: "Delivered Fresh", desc: "Next-day delivery to your door, or collect from Essex Road. Always fresh, never frozen." },
];

/** Fisher-Yates shuffle, then take the first n — used to rotate "Today's Catch" rather than
 * always showing the same fixed products. */
function pickRandom<T>(items: T[], n: number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

export default async function Home() {
  const products = await getAllProducts();
  const todaysCatch = pickRandom(products, 6);

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      {/* Hero — text overlaid on the photo, matching a traditional hero banner */}
      <section className="bg-white">
        <div className="relative bg-navy" style={{ height: "50vh" }}>
          <div
            className="absolute inset-y-0 right-0 w-full sm:w-[80%]"
            style={{
              WebkitMaskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
              maskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
            }}
          >
            <Image src="/hero-shop-floor.jpg" alt="A Steve Hatt fishmonger setting out fresh fish on ice" fill className="object-cover object-[65%_center]" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="mx-auto w-full max-w-6xl px-6 pb-10 sm:pb-0">
              <div className="max-w-2xl">
                <p className="mb-4 text-sm tracking-widest text-white/80 uppercase">Est. 1895 · Essex Road, London</p>
                <h1 className="font-serif text-5xl font-bold leading-[1.1] text-white md:text-6xl lg:text-7xl">
                  From Sea, to Shop, to You.
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/90">
                  The freshest fish from the British coastline, prepared by hand and delivered to your door. Order online for next-day local delivery or click & collect.
                </p>
                <div className="mt-10 flex items-center gap-4">
                  <a href="#shop" className="bg-lobster px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lobster/90" style={{ borderRadius: '3px' }}>
                    Shop Today&apos;s Catch
                  </a>
                  <a href="#how" className="border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10" style={{ borderRadius: '3px' }}>
                    How It Works
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip — full width, directly attached with no gap */}
        <div className="border-b border-border/50 bg-navy">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-6 py-5 md:justify-between">
            {[
              { icon: <Truck className="h-4 w-4" />, text: "Local delivery across Islington" },
              { icon: <Leaf className="h-4 w-4" />, text: "Sustainably sourced" },
              { icon: <Fish className="h-4 w-4" />, text: "Prepared to order" },
              { icon: <Scaling className="h-4 w-4" />, text: "You only pay for what you receive" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm tracking-wide text-white/70">
                <span className="text-teal">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Postcode check — full width, directly attached with no gap */}
        <div className="bg-ocean-light">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <div className="flex-1">
                <h2 className="font-serif text-xl font-semibold text-navy">Check if we deliver to you</h2>
                <p className="mt-1 text-base text-text-light">
                  Enter your postcode to see delivery options. Not in our zone? Click &amp; collect is always available.
                  <br />
                  <Link href="/account" className="font-medium text-navy underline">Sign In/Register</Link> for faster checkout.
                </p>
              </div>
              <div className="w-full max-w-xs md:w-auto">
                <PostcodeCheck />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-xs tracking-widest text-text-light uppercase">Fresh today</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-navy">Today&apos;s Catch</h2>
            </div>
            <Link href="/shop" className="text-sm text-navy hover:underline">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todaysCatch.map((p) => (
              <Link key={p.slug} href={`/shop/${p.slug}`} className="group border border-border bg-white p-4 transition-all hover:border-navy/30 hover:shadow-md" style={{ borderRadius: '5px' }}>
                <div className="relative mb-3 h-40 overflow-hidden bg-sand" style={{ borderRadius: '3px' }}>
                  <Image src={p.image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute left-2 top-2 bg-lobster px-2 py-1 text-[10px] font-medium tracking-wide text-white uppercase" style={{ borderRadius: '2px' }}>{p.tag}</span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy">{p.name}</h3>
                <p className="mt-1 min-h-[45px] text-sm text-text-light">{p.weight}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-navy">{p.priceLabel}</span>
                  <span className="bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-navy/90" style={{ borderRadius: '3px' }}>
                    View
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs tracking-widest text-text-light uppercase">Simple & transparent</p>
          <h2 className="mt-2 mb-10 font-serif text-3xl font-bold text-navy">How It Works</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="border border-border p-6" style={{ borderRadius: '5px' }}>
                <span className="font-serif text-2xl font-light text-lobster/40">{item.step}</span>
                <h3 className="mt-3 font-serif text-base font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-light">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border border-ocean/20 bg-ocean-light p-6" style={{ borderRadius: '5px' }}>
            <p className="text-lg leading-relaxed text-navy">
              <strong>Fair pricing, always.</strong> We estimate the price at checkout based on your selected weight, you&apos;re not charged until your order is prepared and weighed, so you only ever pay for exactly what you receive. No overcharging, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="bg-sand">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs tracking-widest text-text-light uppercase">Our heritage</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-navy">Local Since 1895</h2>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-text-light">
                <p>
                  For over 130 years, Steve Hatt has been the heart of Islington&apos;s food community. What started as a small fishmonger on Essex Road has grown into one of London&apos;s most respected sources of fresh seafood.
                </p>
                <p>
                  We believe in supporting a sustainable ecology by bringing the freshest fish from the British coastline to our community with the smallest possible ecological footprint. Every piece is hand-selected, prepared to order, and delivered with the care you&apos;d expect from a family business.
                </p>
                <p>
                  Now you can order online and have the same quality delivered to your door, or collect from the shop. Same fish, same standards, more convenience.
                </p>
              </div>
              <Link href="/about" className="mt-6 inline-block text-sm text-navy hover:underline">
                Learn more about our story →
              </Link>
            </div>
            <div
              className="relative aspect-square overflow-hidden bg-navy/5"
              style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
            >
              <Image src="/hero.svg" alt="Illustration of the fishing harbour" fill className="object-cover object-[74%_center]" />
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: <Leaf className="h-6 w-6" />, title: "Sustainability", desc: "We source from responsible British fisheries, prioritising seasonal catches and sustainable methods." },
              { icon: <Anchor className="h-6 w-6" />, title: "Local Suppliers", desc: "Our relationships with coastal suppliers span decades. We know where every fish comes from." },
              { icon: <Recycle className="h-6 w-6" />, title: "Zero Waste", desc: "Every cut is prepared to order. No pre-packaging, no waste, no compromise on freshness." },
            ].map((item) => (
              <div key={item.title}>
                <span className="mb-4 block text-teal">{item.icon}</span>
                <h3 className="mb-3 font-serif text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Christmas pre-orders */}
      <section id="christmas" className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="text-xs tracking-widest text-text-light uppercase">Festive season</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-navy">Christmas Pre-Orders</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-text-light">
              Reserve your Christmas feast now. Pre-order by 20th December for delivery or collection on 23rd-24th December. Every order prepared fresh by your fishmonger.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.filter((p) => p.featuredFor?.includes("christmas")).map((p) => (
              <Link key={p.slug} href={`/shop/${p.slug}`} className="group border border-border bg-white p-5 transition-all hover:border-navy/30 hover:shadow-md" style={{ borderRadius: '5px' }}>
                <div className="relative mb-3 h-32 overflow-hidden bg-sand" style={{ borderRadius: '3px' }}>
                  <Image src={p.image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute left-2 top-2 bg-lobster px-2 py-1 text-[10px] font-medium tracking-wide text-white uppercase" style={{ borderRadius: '2px' }}>{p.tag}</span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-navy">{p.name}</h3>
                <p className="mt-1 text-sm text-text-light">{p.weight}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-navy">{p.priceLabel}</span>
                  <span className="bg-navy px-3 py-1.5 text-[10px] font-medium text-white transition-colors group-hover:bg-navy/90" style={{ borderRadius: '3px' }}>
                    Pre-order
                  </span>
                </div>
                {p.preOrderDelivery && (
                  <p className="mt-2 text-[10px] text-teal">{p.preOrderDelivery}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Opening hours + contact */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
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
            <div>
              <h3 className="mb-4 font-serif text-lg font-semibold text-navy">Delivery Zones</h3>
              <p className="text-base text-text-light">
                <strong className="text-navy">Next-day delivery to:</strong><br />
                EC1, EC2, E2, E5, E8, N1, N4, N5, N6, N7, N10, N16, N19, NW5
              </p>
              <p className="mt-2 text-base text-text-light">Minimum order £20 · Standard delivery £5.00</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
