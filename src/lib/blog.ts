export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  coverImage: string;
}

export interface BlogPost extends BlogPostMeta {
  /** Opening paragraphs, shown above the method. */
  intro: string[];
  serves: string;
  difficulty: string;
  ingredients: { name: string; amount: string }[];
  /** Pantry items listed without an amount, shown under the ingredients. */
  ingredientsNote?: string;
  method: { title: string; body: string }[];
  /** Optional tip shown straight after the method. */
  tip?: { heading: string; body: string };
  /** Shop slugs for the "Shop this recipe" callouts beside the ingredients. */
  recipeProductSlugs: string[];
  /** Optional extra products shown below the method. */
  shopSection?: { heading: string; body: string; productSlugs: string[] };
}

/**
 * Posts until real content is pulled from the live site's blog. Each one links out to real shop
 * products by slug, which is the pattern future imported posts should follow too. The newest post
 * is the featured one on /blog.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "classic-christmas-prawn-cocktail",
    title: "Classic Christmas Prawn Cocktail with Smoked Salmon",
    excerpt:
      "The Christmas starter everyone expects, done properly: sweet king prawns, a proper Marie Rose sauce and a ribbon of smoked salmon, ready in 20 minutes.",
    date: "2026-11-16",
    readTime: "6 min read",
    coverImage: "/christmas-prawn-cocktail.jpg",
    intro: [
      "Some Christmas traditions are worth keeping, and the prawn cocktail is one of them. Made with good prawns and a sauce you whisk up yourself, it is a long way from the dinner party cliché, and it can be mostly done the day before, so you are not stuck in the kitchen when the guests arrive.",
      "We have used our king prawns, a little smoked salmon for a touch of luxury, and finished each glass with a spoonful of trout roe. Everything is on the counter at 88 Essex Road, or you can order it here for Christmas collection or delivery.",
    ],
    serves: "Serves 4",
    difficulty: "Easy",
    ingredients: [
      { name: "King prawns, shelled", amount: "400g" },
      { name: "Smoked salmon", amount: "100g" },
      { name: "Little Gem lettuce, finely shredded", amount: "2" },
      { name: "Good mayonnaise", amount: "5 tbsp" },
      { name: "Tomato ketchup", amount: "2 tbsp" },
      { name: "Lemon, juice & zest", amount: "1" },
      { name: "Worcestershire sauce", amount: "1 tsp" },
      { name: "Brandy (optional)", amount: "1 tsp" },
      { name: "Trout roe, to finish", amount: "2 tbsp" },
    ],
    ingredientsNote: "Tabasco, paprika, chives, sea salt and buttered brown bread, to serve",
    method: [
      {
        title: "Make the Marie Rose sauce",
        body: "Whisk the mayonnaise, ketchup, half the lemon juice, Worcestershire sauce, a few drops of Tabasco and the brandy, if using. Taste, add a pinch of salt, then cover and chill. It is better after half an hour in the fridge.",
      },
      {
        title: "Poach the prawns",
        body: "Bring a pan of well-salted water with a slice of lemon to a gentle boil. Add the prawns and cook for 2 to 3 minutes, until pink and opaque all the way through. Drain, cool in iced water, then pat dry. If yours are already cooked, skip this step.",
      },
      {
        title: "Dress the lettuce",
        body: "Toss the shredded lettuce with a squeeze of lemon and a pinch of salt, then divide it between four glasses or small bowls.",
      },
      {
        title: "Build the cocktail",
        body: "Fold the prawns through two thirds of the sauce and spoon them over the lettuce. Tear the smoked salmon into ribbons and tuck them in around the prawns.",
      },
      {
        title: "Finish and serve",
        body: "Spoon over the rest of the sauce, then top with the trout roe, a dusting of paprika, snipped chives and a little lemon zest. Serve well chilled, with lemon wedges and buttered brown bread.",
      },
    ],
    tip: {
      heading: "Make it ahead",
      body: "The sauce and the poached prawns will happily wait in the fridge until the next day. Keep them separate, and build the glasses just before serving so the lettuce stays crisp.",
    },
    recipeProductSlugs: ["king-prawns", "smoked-salmon", "trout-roe"],
    shopSection: {
      heading: "More for the Christmas Table",
      body: "Planning the rest of the menu? Gillardeau oysters make a showstopping canapé, and a cooked lobster is the easy route to a centrepiece. Order ahead and we will have it ready for you.",
      productSlugs: ["oysters-gillardaeu", "lobster-cooked"],
    },
  },
  {
    slug: "tiger-prawn-fresh-crab-linguine",
    title: "Tiger Prawn & Fresh Crab Linguine",
    excerpt:
      "A quick, no-nonsense midweek pasta that lets plump tiger prawns and fresh white crab meat do the talking.",
    date: "2026-07-21",
    readTime: "5 min read",
    coverImage: "/tiger-prawn-crab-linguine.jpg",
    intro: [
      "It's been a good week on the slab. The tiger prawns coming in are some of the plumpest we've seen all season, and our fresh white crab meat is picked and ready to go, no faffing about with shells required. Here's a simple midweek recipe worth making, plus a couple of things we think are worth your attention this week.",
    ],
    serves: "Serves 2",
    difficulty: "Easy",
    ingredients: [
      { name: "Linguine", amount: "200g" },
      { name: "Tiger Prawns, peeled", amount: "200g" },
      { name: "Fresh White Crab Meat", amount: "100g" },
      { name: "Garlic, sliced", amount: "2 cloves" },
      { name: "Red chilli, finely chopped", amount: "1" },
      { name: "Lemon, juice & zest", amount: "1" },
    ],
    ingredientsNote: "Olive oil, flat-leaf parsley, sea salt, to finish",
    method: [
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
    ],
    recipeProductSlugs: ["prawns-tiger", "crab-meat-fresh-white-tub"],
    shopSection: {
      heading: "This Week in the Shop",
      body: "Also worth a look this week: beautiful fresh tuna in loins, and Gillardeau oysters if you're after something special for the weekend.",
      productSlugs: ["fresh-tuna", "oysters-gillardaeu"],
    },
  },
];

/** Newest first, so the latest post is the featured one on the blog index. */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
