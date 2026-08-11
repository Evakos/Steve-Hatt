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
import { getProductBySlug } from "@/lib/products";

const method = [
  {
    title: "Get the pasta on",
    body: "Cook the linguine in well-salted, rapidly boiling water until just al dente, according to the packet timing.",
  },
  {
    title: "Build the base",
    body: "While the pasta cooks, warm a generous glug of olive oil in a large pan over medium heat. Gently fry the garlic and chilli for a minute or two until fragrant, don't let it catch.",
  },
  {
    title: "Cook the prawns",
    body: "Add the tiger prawns to the pan and cook for 2-3 minutes, turning once, until they turn pink and just opaque all the way through.",
  },
  {
    title: "Bring it together",
    body: "Fold in the crab meat, lemon juice and zest, then add the drained linguine along with a splash of the pasta cooking water. Toss everything together until glossy and well coated.",
  },
  {
    title: "Finish and serve",
    body: "Scatter over the chopped parsley, a final drizzle of olive oil and a pinch of sea salt. Serve immediately, while it's hot.",
  },
];

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const [prawns, crab, tuna, oysters] = await Promise.all([
    getProductBySlug("prawns-tiger"),
    getProductBySlug("crab-meat-fresh-white-tub"),
    getProductBySlug("fresh-tuna"),
    getProductBySlug("oysters-gillardaeu"),
  ]);

  const recipeProducts = [prawns, crab].filter((p) => p !== undefined);
  const shopThisWeek = [tuna, oysters].filter((p) => p !== undefined);

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
                <p>
                  It&apos;s been a good week on the slab. The tiger prawns coming in are some of the plumpest
                  we&apos;ve seen all season, and our fresh white crab meat is picked and ready to go, no faffing
                  about with shells required. Here&apos;s a simple midweek recipe worth making, plus a couple of
                  things we think are worth your attention this week.
                </p>
              </div>

              <h2 className="mt-10 font-serif text-2xl font-bold text-navy">Method</h2>
              <div className="mt-6 space-y-6">
                {method.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="font-serif text-2xl font-light text-lobster/40">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-serif text-base font-semibold text-navy">{step.title}</h3>
                      <p className="mt-1 text-lg leading-relaxed text-text-light">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {shopThisWeek.length > 0 && (
                <div className="mt-16 border-t border-border pt-10">
                  <h2 className="font-serif text-2xl font-bold text-navy">This Week in the Shop</h2>
                  <p className="mt-4 text-lg leading-relaxed text-text-light">
                    Also worth a look this week: beautiful fresh tuna in loins, and Gillardeau oysters if
                    you&apos;re after something special for the weekend.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {shopThisWeek.map((product) => (
                      <ProductCallout key={product.slug} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients sidebar — stays in view as the method scrolls past */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border border-border bg-sand/60 p-6" style={{ borderRadius: "8px" }}>
                <h2 className="font-serif text-xl font-bold text-navy">Ingredients</h2>
                <div className="mt-3 flex items-center gap-4 text-xs tracking-wide text-text-light uppercase">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Serves 2
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ChefHat className="h-3.5 w-3.5" />
                    Easy
                  </span>
                </div>
                <ul className="mt-5 space-y-3 text-sm text-text-light">
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Linguine</span>
                    <span className="shrink-0 font-medium text-navy">200g</span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Tiger Prawns, peeled</span>
                    <span className="shrink-0 font-medium text-navy">200g</span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Fresh White Crab Meat</span>
                    <span className="shrink-0 font-medium text-navy">100g</span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Garlic, sliced</span>
                    <span className="shrink-0 font-medium text-navy">2 cloves</span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Red chilli, finely chopped</span>
                    <span className="shrink-0 font-medium text-navy">1</span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-border/70 pb-3">
                    <span>Lemon, juice &amp; zest</span>
                    <span className="shrink-0 font-medium text-navy">1</span>
                  </li>
                  <li className="text-text-light">Olive oil, flat-leaf parsley, sea salt, to finish</li>
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
