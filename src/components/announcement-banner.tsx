"use client";

import { useState } from "react";
import { Gift, X, Snowflake } from "lucide-react";
import Link from "next/link";

type BannerVariant = "christmas" | "easter" | "summer" | "generic";

interface BannerConfig {
  icon: React.ReactNode;
  bg: string;
  textColor: string;
  accent: string;
  message: string;
  cta: string;
  ctaHref: string;
}

const banners: Record<string, BannerConfig> = {
  christmas: {
    icon: <Snowflake className="h-4 w-4" />,
    bg: "bg-[#c94b4b]",
    textColor: "text-white",
    accent: "text-white",
    message: "Christmas pre-orders are now open! Reserve your festive feast.",
    cta: "Pre-order now",
    ctaHref: "/shop",
  },
};

interface Props {
  variant?: BannerVariant;
  /** Override the default message */
  message?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
}

export default function AnnouncementBanner({
  variant = "christmas",
  message,
  dismissible = true,
}: Props) {
  const [visible, setVisible] = useState(true);
  const config = banners[variant] || banners.christmas;

  if (!visible) return null;

  return (
    <div className={`relative ${config.bg} ${config.textColor}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-2.5">
        <div className="flex items-center gap-2 text-center text-xs md:text-sm">
          <span className={config.accent}>{config.icon}</span>
          <span>
            {message || config.message}{" "}
            <Link
              href={config.ctaHref}
              className={`inline-block underline underline-offset-2 transition-opacity hover:opacity-80 ${config.accent}`}
            >
              {config.cta} →
            </Link>
          </span>
        </div>

        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            className={`ml-4 shrink-0 opacity-60 transition-opacity hover:opacity-100 ${config.textColor}`}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
