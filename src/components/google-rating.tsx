import type { GoogleReviewData } from "@/lib/google-reviews";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <polygon
        points="12,1.5 15.1,8.6 22.8,9.3 17,14.4 18.7,22 12,18 5.3,22 7,14.4 1.2,9.3 8.9,8.6"
        fill={filled ? "#FFC21A" : "rgba(255,255,255,0.3)"}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Slim "rated on Google" strip for the hero: stars, the rating and the review count, linking to the
 * shop's Google listing. Plain text, no Google logo. */
export default function GoogleRating({ data }: { data: GoogleReviewData }) {
  const stars = Math.round(data.rating);
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 text-sm text-white/85 transition-colors hover:text-white"
    >
      <span className="flex gap-0.5" role="img" aria-label={`${data.rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} filled={i < stars} />
        ))}
      </span>
      <span>
        <strong className="font-medium text-white">{data.rating.toFixed(1)}</strong> &middot; {data.reviewCount} reviews on Google
      </span>
    </a>
  );
}
