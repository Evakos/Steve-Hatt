import "server-only";

/**
 * The shop's Google rating and review count, shown as a strip in the homepage hero.
 *
 * With GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID set (a server-only key, restricted to the Places API) this
 * reads the live figures from Google and refreshes them every six hours. Without them it falls back to the
 * numbers below.
 *
 * IMPORTANT: the fallback figures were taken from a directory listing that cites Google, not from Google
 * itself. Check them against the shop's Google Business Profile, or set the two env vars, before launch.
 */
export interface GoogleReviewData {
  rating: number;
  reviewCount: number;
  url: string;
}

const FALLBACK: GoogleReviewData = {
  rating: 4.8,
  reviewCount: 321,
  url: "https://www.google.com/maps/search/?api=1&query=Steve+Hatt+Fishmongers+88+Essex+Road+London+N1+8LU",
};

export async function getGoogleReviewData(): Promise<GoogleReviewData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return FALLBACK;

  try {
    const params = new URLSearchParams({ place_id: placeId, fields: "rating,user_ratings_total,url", key: apiKey });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return FALLBACK;

    const data = await res.json();
    if (data?.status !== "OK" || !data?.result) return FALLBACK;

    const { rating, user_ratings_total, url } = data.result;
    if (typeof rating !== "number" || typeof user_ratings_total !== "number") return FALLBACK;

    return { rating, reviewCount: user_ratings_total, url: url || FALLBACK.url };
  } catch {
    return FALLBACK;
  }
}
