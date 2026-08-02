export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  coverImage: string;
}

/**
 * Placeholder posts until real content is pulled from the live site's blog. This one is a
 * worked example showing how a post can link out to real shop products (see productSlugs in
 * src/app/blog/[slug]/page.tsx), which is the pattern future imported posts should follow too.
 */
export const blogPosts: BlogPostMeta[] = [
  {
    slug: "tiger-prawn-fresh-crab-linguine",
    title: "Tiger Prawn & Fresh Crab Linguine",
    excerpt:
      "A quick, no-nonsense midweek pasta that lets plump tiger prawns and fresh white crab meat do the talking.",
    date: "2026-07-21",
    readTime: "5 min read",
    coverImage: "/tiger-prawn-crab-linguine.jpg",
  },
];

export function getAllPosts(): BlogPostMeta[] {
  return blogPosts;
}

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
