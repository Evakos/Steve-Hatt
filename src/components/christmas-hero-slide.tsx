"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fulfilmentAction } from "@/lib/christmas-fulfilment";

/** Snowflake particle for the falling snow effect. */
function Snowflake({ x, y, size, opacity, duration, delay, drift, style, points }: {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  style?: React.CSSProperties & Record<string, string | number>;
  points: number;
}) {
  const combinedStyle = {
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    background: "white",
    opacity,
    animation: `snow-fall ${duration}s linear ${delay}s infinite`,
    transform: "translate(-50%, -50%)",
    willChange: "transform, opacity",
    clipPath: points === 6
      ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      : "polygon(50% 0%, 80% 38%, 100% 38%, 85% 60%, 95% 100%, 50% 75%, 5% 100%, 15% 60%, 0% 38%, 20% 38%)",
    ...style,
  };

  return (
    <div className="absolute pointer-events-none" style={combinedStyle} />
  );
}

/** CSS-in-JS keyframes for snow falling with horizontal drift. */
const snowStyles = `
  @keyframes snow-fall {
    0% { transform: translate(-50%, -50%) translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: var(--snow-opacity); }
    90% { opacity: var(--snow-opacity); }
    100% { transform: translate(-50%, -50%) translateY(120vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
  }
`;

/** The second hero slide, shown only while Christmas pre-ordering is on. */
export default function ChristmasHeroSlide({ when, fulfilment, lastDay, proof }: { when: string; fulfilment: string; lastDay: string; proof?: ReactNode }) {
  const [snowflakes, setSnowflakes] = useState<Array<{
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    drift: number;
    points: number;
  }>>([]);

  useEffect(() => {
    // Delay snow generation so it starts after text/tree animations
    const timer = setTimeout(() => {
      const flakes = Array.from({ length: 25 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * -20, // Start slightly above viewport
        size: Math.random() * 6 + 5, // 5-11px
        opacity: Math.random() * 0.4 + 0.4, // 0.4-0.8
        duration: Math.random() * 15 + 25, // 25-40s (slower, smoother)
        delay: Math.random() * 5, // 0-5s stagger
        drift: (Math.random() - 0.5) * 100, // -50 to 50px drift (less extreme)
        points: Math.random() > 0.5 ? 6 : 8,
      }));
      setSnowflakes(flakes);
    }, 3000); // Start snow ~3s after mount (after text at ~1.6-1.9s, tree at ~2.5s)

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-navy sm:flex sm:min-h-[max(560px,62vh)] 2xl:min-h-[max(520px,56vh)]">
      {/* Snow falling styles with custom property for drift */}
      <style dangerouslySetInnerHTML={{ __html: snowStyles }} />

      {/* Full-bleed background image with mask gradient (like main hero) - more transparent */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-[70%]"
        style={{
          WebkitMaskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
          maskImage: "linear-gradient(115deg, transparent 0%, transparent 12%, black 40%, black 100%)",
        }}
      >
        <Image src="/christmas-hero-2.svg" alt="Christmas festive hero illustration" fill sizes="100vw" className="object-cover object-[65%_center] opacity-10" priority />
        <div className="absolute inset-0 bg-navy/60 sm:bg-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/85 via-navy/20 to-[#0d1b2a]/70 sm:from-navy/70 sm:via-transparent sm:to-[#0d1b2a]/50" />
      </div>

      {/* Snow falling overlay - only renders after hydration */}
      {snowflakes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {snowflakes.map((flake, i) => (
            <Snowflake
              key={i}
              {...flake}
              style={{
                "--snow-opacity": flake.opacity,
                "--drift": `${flake.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Foreground Christmas tree image on the right (like the cockerel was) - bigger on desktop, hidden on mobile */}
      <div className="pointer-events-none absolute inset-y-0 right-0 left-0 hidden lg:block animate-fade-in-scale" style={{ zIndex: 5, animationDelay: "2500ms" }}>
        <div className="mx-auto flex h-full max-w-6xl items-center justify-end px-6 lg:pr-12 xl:pr-24">
          <Image
            src="/christmas-hero-2.svg"
            alt="Christmas festive tree illustration"
            width={749}
            height={842}
            sizes="400px"
            priority
            className="h-[85%] max-h-[420px] w-auto 2xl:h-[95%] 2xl:max-h-[550px] min-[2200px]:h-[98%] min-[2200px]:max-h-[650px]"
          />
        </div>
      </div>

      {/* Text content */}
      <div className="relative flex sm:absolute sm:inset-0 sm:items-center" style={{ zIndex: 20 }}>
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