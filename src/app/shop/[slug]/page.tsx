import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { Gift, Scale, MapPin, Thermometer, Leaf } from "lucide-react";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import AddToCart from "@/components/add-to-cart";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.name} | Steve Hatt Fishmongers`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const allProducts = await getAllProducts();
  const related = allProducts.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);
  if (related.length < 4) {
    const extras = allProducts.filter((p) => p.slug !== product.slug && p.category !== product.category).slice(0, 4 - related.length);
    related.push(...extras);
  }

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="text-sm text-text-light">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/#shop" className="hover:text-navy">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-navy">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product detail */}
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
            {/* Image */}
            <div className="relative aspect-5/4 overflow-hidden bg-white" style={{ borderRadius: '5px' }}>
              <Image src={product.image} alt={product.name} fill className="object-cover" />
              <span className="absolute left-4 top-4 bg-lobster px-3 py-1.5 text-xs font-medium tracking-wide text-white uppercase" style={{ borderRadius: '2px' }}>
                {product.tag}
              </span>
            </div>

            {/* Details */}
            <div>
              <span className="text-xs tracking-widest text-text-light uppercase">{product.category}</span>
              <h1 className="mt-1.5 font-serif text-4xl font-bold text-navy">{product.name}</h1>
              <p className="mt-1 text-sm text-text-light">{product.origin}</p>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-navy">{product.priceLabel}</span>
                <span className="text-sm text-text-light">{product.weight}</span>
              </div>

              <p className="mt-4 leading-relaxed text-foreground">{product.description}</p>

              <AddToCart product={product} />

              {/* Christmas availability note */}
              {product.featuredFor?.includes("christmas") && (
                <div className="mt-3 flex items-center gap-2 border border-[#1a3a2a]/20 bg-[#e8f5ed] px-4 py-3" style={{ borderRadius: '5px' }}>
                  <Gift className="h-4 w-4 shrink-0 text-[#1a3a2a]" />
                  <p className="text-xs text-[#1a3a2a]/80">
                    Available for Christmas pre-order — choose a festive delivery date at checkout.
                  </p>
                </div>
              )}

              {/* Fair pricing notice */}
              <div className="mt-4 flex items-start gap-3 border border-ocean/20 bg-ocean-light p-4" style={{ borderRadius: '5px' }}>
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-navy/60" />
                <p className="text-xs leading-relaxed text-navy">
                  <strong>Fair pricing.</strong> We estimate the price at checkout. You&apos;re not charged until your order is prepared and weighed, so you only pay for exactly what you receive.
                </p>
              </div>

              {/* Info grid */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="border border-border bg-white p-4" style={{ borderRadius: '5px' }}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-text-light" />
                    <p className="text-xs tracking-widest text-text-light uppercase">Origin</p>
                  </div>
                  <p className="text-sm text-navy">{product.origin}</p>
                </div>
                <div className="border border-border bg-white p-4" style={{ borderRadius: '5px' }}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-text-light" />
                    <p className="text-xs tracking-widest text-text-light uppercase">Storage</p>
                  </div>
                  <p className="text-sm text-navy">{product.storage}</p>
                </div>
              </div>

              {/* Sustainability */}
              <div className="mt-2 border border-border bg-white p-4" style={{ borderRadius: '5px' }}>
                <div className="mb-1 flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-text-light" />
                  <p className="text-xs tracking-widest text-text-light uppercase">Sustainability</p>
                </div>
                <p className="text-sm text-navy">{product.sustainability}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="mb-8 font-serif text-2xl font-bold text-navy">You might also like</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link key={p.slug} href={`/shop/${p.slug}`} className="group border border-border bg-cream p-4 transition-all hover:border-navy/30 hover:shadow-md" style={{ borderRadius: '5px' }}>
                  <div className="relative mb-3 aspect-square overflow-hidden" style={{ borderRadius: '3px' }}>
                    <Image src={p.image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-navy">{p.name}</h3>
                  <p className="mt-1 text-sm text-text-light">{p.priceLabel}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Delivery info */}
      <section className="bg-ocean-light">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-navy">Next-day local delivery</p>
              <p className="mt-1 text-xs text-text-light">Order by 6pm for delivery tomorrow. Min £20, £5.00 delivery.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">Click & collect</p>
              <p className="mt-1 text-xs text-text-light">Order online, collect from 88 Essex Road.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">Prepared to order</p>
              <p className="mt-1 text-xs text-text-light">Filleted, trimmed and packed by your fishmonger.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo-alt.svg" alt="Steve Hatt" width={120} height={50} className="h-8 w-auto" />
            </div>
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Steve Hatt Fishmongers</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
