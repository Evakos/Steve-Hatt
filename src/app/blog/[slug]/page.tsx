import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, Users, ChefHat } from "lucide-react";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import ProductCallout from "@/components/blog/product-callout";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { getProductBySlug, type Product } from "@/lib/products";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return { title: `${post.title} | Steve Hatt Fishmongers`, description: post.excerpt };
}

async function loadProducts(slugs: string[]): Promise<Product[]> {
  const found = await Promise.all(slugs.map((s) => getProductBySlug(s)));
  return found.filter((p): p is Product => p !== undefined);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const [recipeProducts, shopProducts] = await Promise.all([
    loadProducts(post.recipeProductSlugs),
    loadProducts(post.shopSection?.productSlugs ?? []),
  ]);

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <Link href="/blog" className="text-sm text-navy hover:underline">← Recipes &amp; News</Link>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs tracking-wide text-text-light uppercase">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-4xl">{post.title}</h1>
        </div>
      </section>

      <section className="relative h-64 md:h-96" style={{ minHeight: "260px" }}>
        <Image src={post.coverImage} alt="" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <div className="min-w-0">
              <div className="space-y-4 text-lg leading-relaxed text-text-light">
                {post.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <h2 className="mt-10 font-serif text-2xl font-bold text-navy">Method</h2>
              <div className="mt-6 space-y-6">
                {post.method.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="font-serif text-2xl font-light text-lobster/40">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-serif text-base font-semibold text-navy">{step.title}</h3>
                      <p className="mt-1 text-lg leading-relaxed text-text-light">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {post.tip && (
                <div className="mt-8 bg-sand/60 p-5" style={{ borderRadius: "8px" }}>
                  <h3 className="font-serif text-base font-semibold text-navy">{post.tip.heading}</h3>
                  <p className="mt-1 text-base leading-relaxed text-text-light">{post.tip.body}</p>
                </div>
              )}

              {post.shopSection && shopProducts.length > 0 && (
                <div className="mt-16 border-t border-border pt-10">
                  <h2 className="font-serif text-2xl font-bold text-navy">{post.shopSection.heading}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-text-light">{post.shopSection.body}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {shopProducts.map((product) => (
                      <ProductCallout key={product.slug} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients sidebar - stays in view as the method scrolls past */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border border-border bg-sand/60 p-6" style={{ borderRadius: "8px" }}>
                <h2 className="font-serif text-xl font-bold text-navy">Ingredients</h2>
                <div className="mt-3 flex items-center gap-4 text-xs tracking-wide text-text-light uppercase">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {post.serves}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ChefHat className="h-3.5 w-3.5" />
                    {post.difficulty}
                  </span>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-text-light">
                  {post.ingredients.map((item) => (
                    <li key={item.name} className="flex justify-between gap-3 border-b border-border/70 pb-3">
                      <span>{item.name}</span>
                      <span className="shrink-0 font-medium text-navy">{item.amount}</span>
                    </li>
                  ))}
                  {post.ingredientsNote && <li className="text-text-light">{post.ingredientsNote}</li>}
                </ul>

                {recipeProducts.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="mb-3 text-xs tracking-widest text-text-light uppercase">Shop this recipe</p>
                    <div className="space-y-3">
                      {recipeProducts.map((product) => (
                        <ProductCallout key={product.slug} product={product} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
