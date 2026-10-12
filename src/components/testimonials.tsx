import { Quote, Star } from "lucide-react";
import { testimonials as allTestimonials } from "@/content/testimonials";

/** The homepage shows the first three entries, one tidy row. */
const testimonials = allTestimonials.slice(0, 3);

/** Homepage customer-review grid. Hidden when there are no testimonials; labelled as sample content
 * while any entry is still a placeholder (see content/testimonials.ts). */
export default function Testimonials() {
  if (testimonials.length === 0) return null;
  const hasPlaceholders = testimonials.some((t) => t.placeholder);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-widest text-text-light uppercase">Kind words</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-navy">What our customers say</h2>
          {hasPlaceholders && (
            <p className="mx-auto mt-3 inline-block bg-lobster-light px-3 py-1 text-xs font-medium text-lobster" style={{ borderRadius: "999px" }}>
              Sample reviews, to be replaced with real ones
            </p>
          )}
        </div>
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          {testimonials.map((t, i) => (
            <figure key={i} className="flex flex-col">
              {t.rating ? (
                <div className="flex gap-1 text-lobster" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <Star key={n} className={`h-5 w-5 ${n < t.rating! ? "fill-current" : "text-border"}`} aria-hidden />
                  ))}
                </div>
              ) : (
                <Quote className="h-6 w-6 text-lobster" aria-hidden />
              )}
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-navy">{t.quote}</blockquote>
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
      </div>
    </section>
  );
}
