import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ImageOff } from "lucide-react";
import Header from "@/components/header";
import AnnouncementBanner from "@/components/announcement-banner";
import Footer from "@/components/footer";
import { getAllPosts, type BlogPostMeta } from "@/lib/blog";

/** Coming-soon teasers for posts not yet pulled in from the live site's blog. */
const placeholders = [
  { title: "Smoked Fish Pâté for Summer", category: "Recipe" },
  { title: "How to Fillet a Whole Fish", category: "Guide" },
  { title: "Christmas Order Guide 2026", category: "News" },
];

export const metadata = {
  title: "Recipes & News | Steve Hatt Fishmongers",
  description: "Recipes, seasonal recommendations and news from Steve Hatt Fishmongers.",
};

function PostMeta({ post, className = "" }: { post: BlogPostMeta; className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-xs tracking-wide text-text-light uppercase ${className}`}>
      <span className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {post.readTime}
      </span>
    </div>
  );
}

export default function BlogIndexPage() {
  const [featured, ...rest] = getAllPosts();

  return (
    <main className="flex flex-1 flex-col">
      <AnnouncementBanner />
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-8 text-center">
          <p className="text-xs tracking-widest text-lobster uppercase">From the shop</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-4xl">Recipes &amp; News</h1>
          <p className="mt-4 text-lg leading-relaxed text-text-light">
            Recipes, seasonal recommendations and news from the counter at 88 Essex Road.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-20">
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mb-10 grid overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-lg md:grid-cols-2"
              style={{ borderRadius: "8px" }}
            >
              <div className="relative h-56 overflow-hidden md:h-full">
                <Image src={featured.coverImage} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span
                  className="absolute left-4 top-4 bg-lobster px-3 py-1 text-[10px] font-medium tracking-widest text-white uppercase"
                  style={{ borderRadius: "2px" }}
                >
                  Featured Recipe
                </span>
              </div>
              <div className="flex flex-col justify-center p-8">
                <PostMeta post={featured} />
                <h2 className="mt-3 font-serif text-2xl font-bold text-navy md:text-3xl">{featured.title}</h2>
                <p className="mt-3 text-lg leading-relaxed text-text-light">{featured.excerpt}</p>
                <span className="mt-5 inline-flex w-fit items-center gap-1 text-sm font-medium text-navy underline group-hover:no-underline">
                  Read the recipe →
                </span>
              </div>
            </Link>
          )}

          {(rest.length > 0 || placeholders.length > 0) && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderRadius: "8px" }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image src={post.coverImage} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <PostMeta post={post} />
                    <h2 className="mt-3 font-serif text-xl font-bold text-navy">{post.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-text-light">{post.excerpt}</p>
                    <span className="mt-4 inline-block self-start text-sm text-navy underline group-hover:no-underline">
                      Read more →
                    </span>
                  </div>
                </Link>
              ))}

              {placeholders.map((post) => (
                <div
                  key={post.title}
                  className="flex flex-col overflow-hidden border border-dashed border-border bg-sand/40"
                  style={{ borderRadius: "8px" }}
                >
                  <div className="flex h-48 items-center justify-center bg-sand/60">
                    <ImageOff className="h-6 w-6 text-text-light/50" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs tracking-widest text-text-light/70 uppercase">{post.category} · Coming soon</p>
                    <h2 className="mt-3 font-serif text-xl font-bold text-navy/60">{post.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-text-light/70">
                      This one&apos;s on its way, check back soon.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
