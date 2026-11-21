import Image from "next/image";

interface Props {
  /** Leave out for a plain navy banner with no picture. */
  image?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Minimum height in pixels. Defaults to the tall banner the other inner pages use. */
  minHeight?: number;
}

/** The small label above and below the title: a short line either side of the words. */
const labelClass = "flex items-center justify-center gap-3 text-xs font-medium tracking-[0.25em] text-white/70 uppercase";

/** Matches the live site's actual inner-page banner convention (About, Recruitment): a solid
 * navy overlay over a photo, with a dash-wrapped eyebrow label and (optionally) a matching
 * dash-wrapped subtitle beneath the title - distinct from the homepage's own left-to-right
 * gradient hero, which only the homepage uses. */
export default function InnerPageHero({ image, eyebrow, title, subtitle, minHeight = 560 }: Props) {
  return (
    <section className="relative flex items-center justify-center bg-navy text-center" style={{ minHeight: `${minHeight}px` }}>
      {image && (
        <>
          <Image src={image} alt="" fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-navy/85" />
        </>
      )}
      <div className="relative mx-auto max-w-2xl px-6">
        <p className={labelClass}>
          <span className="h-px w-6 bg-white/40" aria-hidden />
          {eyebrow}
          <span className="h-px w-6 bg-white/40" aria-hidden />
        </p>
        <h1 className="mt-5 font-serif text-4xl leading-tight font-bold text-white md:text-5xl">{title}</h1>
        {subtitle && (
          <p className={`mt-5 ${labelClass}`}>
            <span className="h-px w-6 bg-white/40" aria-hidden />
            {subtitle}
            <span className="h-px w-6 bg-white/40" aria-hidden />
          </p>
        )}
      </div>
    </section>
  );
}
