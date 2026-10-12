import Image from "next/image";
import { Quote } from "lucide-react";
import { testimonials as allTestimonials } from "@/content/testimonials";

/** Customer reviews fill the grid (first three, one tidy row). Press quotes, which have a `source` and no
 * rating, are not customers, so they sit on their own line underneath. */
const testimonials = allTestimonials.filter((t) => !t.source).slice(0, 3);
const press = allTestimonials.find((t) => t.source);

/** A crisp five-pointed star with sharp points (no rounded joins), in a bright yellow. */
function SharpStar({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <polygon
        points="12,1.5 15.1,8.6 22.8,9.3 17,14.4 18.7,22 12,18 5.3,22 7,14.4 1.2,9.3 8.9,8.6"
        fill={filled ? "#FFC21A" : "#E5E7EB"}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Homepage customer-review grid. Hidden when there are no testimonials. Entries still marked
 * `placeholder: true` in content/testimonials.ts are sample text and must be replaced before launch. */
export default function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t border-navy/5 bg-sand">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-widest text-text-light uppercase">Kind words</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-navy">What our customers say</h2>
        </div>
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {testimonials.map((t, i) => (
            <figure key={i} className="flex flex-col">
              {t.rating ? (
                <div className="flex gap-1" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <SharpStar key={n} filled={n < t.rating!} />
                  ))}
                </div>
              ) : (
                <Quote className="h-6 w-6 text-lobster" aria-hidden />
              )}
              <blockquote className="mt-4 flex-1 text-lg leading-snug text-navy">{t.quote}</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-medium text-navy">{t.name}</p>
                {t.source ? (
                  <p className="text-sm text-text-light">
                    {t.href ? (
                      <a href={t.href} target="_blank" rel="noopener noreferrer" className="underline decoration-lobster/50 underline-offset-2 hover:text-navy hover:decoration-lobster">
                        {t.source}
                      </a>
                    ) : (
                      t.source
                    )}
                  </p>
                ) : (
                  t.detail && <p className="text-sm text-text-light">{t.detail}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        {press && (
          <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-4">
            {press.logo && (
              <Image src={press.logo.src} alt={press.logo.alt} width={press.logo.width} height={Math.round(press.logo.width / 3)} className="h-auto w-auto max-h-8" />
            )}
          <p className="text-center text-base italic leading-relaxed text-text-light">
            &ldquo;{press.quote}&rdquo;{" "}
            <span className="not-italic">
              {press.href ? (
                <a href={press.href} target="_blank" rel="noopener noreferrer" className="font-medium text-navy underline decoration-lobster/50 underline-offset-2 hover:decoration-lobster">
                  {press.name}
                </a>
              ) : (
                press.name
              )}
              {press.source ? `, ${press.source.toLowerCase()}` : ""}
            </span>
          </p>
          </div>
        )}
      </div>
    </section>
  );
}
