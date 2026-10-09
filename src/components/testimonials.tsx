import { Quote } from "lucide-react";
import { testimonials } from "@/content/testimonials";

/** Homepage customer-review grid. Hidden when there are no testimonials; labelled as sample content
 * while any entry is still a placeholder (see content/testimonials.ts). */
export default function Testimonials() {
  if (testimonials.length === 0) return null;
  const hasPlaceholders = testimonials.some((t) => t.placeholder);

  return (
    <section className="overflow-hidden bg-cream">
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
        <div className="relative">
          {/* Full-bleed navy band that starts partway down the first row of cards (so the cards poke
              above it) and fades out to the page colour. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[50vw] -bottom-20 -left-[50vw] top-24"
            style={{ background: "linear-gradient(to bottom, #242E67 0%, rgba(36,46,103,0.55) 40%, rgba(36,46,103,0) 100%)" }}
          />
        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col border border-border bg-white p-6 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ borderRadius: "14px" }}
            >
              <Quote className="h-6 w-6 text-lobster" aria-hidden />
              <blockquote className="mt-4 flex-1 text-base leading-relaxed text-text">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
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
      </div>
    </section>
  );
}
