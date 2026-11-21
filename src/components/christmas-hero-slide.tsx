import type { ReactNode } from "react";
import Image from "next/image";

/**
 * The folk-art cockerel beside the text on wide screens: from the Illustrator EPS in the stock set, taken out of its card and
 * recoloured for the navy slide (cream bird, coral comb and legs). Hidden on phones and tablets, where the text has the whole slide.
 */
const FOLK_ART = { src: "/christmas-folk-rooster.png", alt: "Folk-art cockerel with the words Merry Christmas", width: 749, height: 842 };

/** The second hero slide, shown only while Christmas pre-ordering is on. */
export default function ChristmasHeroSlide({ when, fulfilment, lastDay, proof }: { when: string; fulfilment: string; lastDay: string; proof?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-navy sm:h-[46vh] sm:min-h-[440px]">
      <div className="relative flex h-full sm:items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-9 pb-12 sm:py-0">
          <div className="max-w-2xl lg:max-w-[min(42rem,calc(100%-22rem))]">
            <p className="mb-3 text-[11px] font-medium tracking-widest text-lobster uppercase sm:mb-4 sm:text-xs">Christmas pre-orders now open</p>
            <h2 className="font-serif text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-5xl xl:text-6xl">
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

      <div className="pointer-events-none absolute inset-y-0 right-0 left-0 hidden lg:block">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-end px-6">
          <Image
            src={FOLK_ART.src}
            alt={FOLK_ART.alt}
            width={FOLK_ART.width}
            height={FOLK_ART.height}
            sizes="400px"
            priority
            className="h-[92%] max-h-[460px] w-auto"
          />
        </div>
      </div>
    </div>
  );
}
