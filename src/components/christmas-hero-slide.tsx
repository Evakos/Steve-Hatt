import type { ReactNode } from "react";
import Image from "next/image";

/**
 * The Christmas photo for the homepage hero. Until one is supplied the slide uses a plain green
 * background. To use it: add the file to /public (for example /public/hero-christmas.jpg) and set this
 * to "/hero-christmas.jpg".
 */
const CHRISTMAS_HERO_IMAGE: string | null = null;

/** The second hero slide, shown only while Christmas pre-ordering is on. */
export default function ChristmasHeroSlide({ when, fulfilment, lastDay, proof }: { when: string; fulfilment: string; lastDay: string; proof?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#1a3a2a] sm:h-[40vh] sm:min-h-[400px]">
      {CHRISTMAS_HERO_IMAGE ? (
        <div className="absolute inset-0">
          <Image src={CHRISTMAS_HERO_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#1a3a2a]/60 sm:bg-[#1a3a2a]/45" />
        </div>
      ) : (
        // Until a Christmas photo is supplied: the hand-drawn Christmas pattern, in white and faint so the text stays clear.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "url(/christmas-pattern.svg)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="relative flex h-full sm:items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-9 pb-12 sm:py-0">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-medium tracking-widest text-white/80 uppercase sm:mb-4 sm:text-xs">Christmas pre-orders now open</p>
            <h2 className="font-serif text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-5xl lg:text-6xl">
              Your Christmas fish, ordered ahead.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg">
              Reserve fresh fish and shellfish for the festive table, then choose {fulfilment} {when}. {lastDay}
            </p>
            {proof}
            <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-4">
              <a href="#christmas" className="bg-lobster px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-lobster/90" style={{ borderRadius: "6px" }}>
                Order for Christmas
              </a>
              <a href="/shop" className="border border-white/40 px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10" style={{ borderRadius: "6px" }}>
                Shop all fish
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
