import Image from "next/image";

interface Props {
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

/** Matches the live site's actual inner-page banner convention (About, Recruitment): a solid
 * navy overlay over a photo, with a dash-wrapped eyebrow label and (optionally) a matching
 * dash-wrapped subtitle beneath the title — distinct from the homepage's own left-to-right
 * gradient hero, which only the homepage uses. */
export default function InnerPageHero({ image, eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative flex items-center justify-center bg-navy text-center" style={{ minHeight: "400px" }}>
      <Image src={image} alt="" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-navy/75" />
      <div className="relative mx-auto max-w-2xl px-6">
        <p className="text-sm tracking-widest text-white/70 uppercase">— {eyebrow} —</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-white md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm tracking-widest text-white/70 uppercase">— {subtitle} —</p>}
      </div>
    </section>
  );
}
