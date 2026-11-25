import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { fulfilmentAction } from "@/lib/christmas-fulfilment";

/** The second hero slide, shown only while Christmas pre-ordering is on. */
export default function ChristmasHeroSlide({ when, fulfilment, lastDay, proof }: { when: string; fulfilment: string; lastDay: string; proof?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-navy sm:flex sm:min-h-[max(560px,62vh)] 2xl:min-h-[max(520px,56vh)]">
      {/* Full-bleed background image with mask gradient (like main hero) */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-[80%]"
        style={{
          WebkitMaskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
          maskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
        }}
      >
        <Image src="/christmas-hero-2.svg" alt="Christmas festive hero illustration" fill sizes="100vw" className="object-cover object-[65%_center]" priority />
        <div className="absolute inset-0 bg-navy/60 sm:bg-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent sm:from-navy/70 sm:via-transparent" />
      </div>

      {/* Foreground Christmas tree image on the right (like the cockerel was) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 left-0 hidden lg:block">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-end px-6 lg:pr-12 xl:pr-24">
          <Image
            src="/christmas-hero-2.svg"
            alt="Christmas festive tree illustration"
            width={749}
            height={842}
            sizes="400px"
            priority
            className="h-[66%] max-h-[310px] w-auto 2xl:h-[80%] 2xl:max-h-[440px] min-[2200px]:h-[86%] min-[2200px]:max-h-[560px]"
          />
        </div>
      </div>

      {/* Text content */}
      <div className="relative flex sm:absolute sm:inset-0 sm:items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-9 sm:py-0">
          <div className="max-w-2xl">
            <p className="animate-fade-up mb-3 text-[11px] font-medium tracking-widest text-lobster uppercase sm:mb-4 sm:text-xs" style={{ animationDelay: "1600ms" }}>Christmas pre-orders now open</p>
            <h2 className="animate-fade-up font-serif text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl" style={{ animationDelay: "1690ms" }}>
              Your Christmas fish,<br className="hidden sm:block" /> ordered ahead.
            </h2>
            <p className="animate-fade-up mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg" style={{ animationDelay: "1780ms" }}>
              Reserve fresh fish and shellfish for the festive table, then {fulfilmentAction(fulfilment)} {when}. {lastDay}
            </p>
            {proof}
            <div className="animate-fade-up mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-4" style={{ animationDelay: "1870ms" }}>
              <Link href="#christmas" className="bg-lobster px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-lobster/90" style={{ borderRadius: "6px" }}>
                Order for Christmas
              </Link>
              <Link href="/shop" className="border border-white/40 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10" style={{ borderRadius: "6px" }}>
                Shop all fish
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}