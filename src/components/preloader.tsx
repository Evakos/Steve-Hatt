"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const LOGO_FADE_IN_MS = 400;
const MIN_VISIBLE_MS = 1500;
const FADE_MS = 500;

export default function Preloader() {
  const [logoVisible, setLogoVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setLogoVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const minTime = new Promise<void>((resolve) => setTimeout(resolve, MIN_VISIBLE_MS));
    const pageLoad = new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      window.addEventListener("load", () => resolve(), { once: true });
    });

    Promise.all([minTime, pageLoad]).then(() => setHidden(true));
  }, []);

  useEffect(() => {
    if (!hidden) return;
    const timer = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(timer);
  }, [hidden]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy transition-opacity ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <Image
        src="/logo-alt.svg"
        alt="Steve Hatt Fishmongers"
        width={180}
        height={80}
        className={`h-14 w-auto transition-opacity ${logoVisible ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: `${LOGO_FADE_IN_MS}ms` }}
        priority
      />
    </div>
  );
}
