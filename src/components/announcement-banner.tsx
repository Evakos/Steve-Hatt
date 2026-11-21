"use client";

import { useEffect, useState } from "react";
import { X, Snowflake, Info } from "lucide-react";
import Link from "next/link";
import { ordersClosedReason } from "@/lib/ordering-window";

type BannerVariant = "christmas" | "easter" | "summer" | "generic";

interface BannerConfig {
  icon: React.ReactNode;
  bg: string;
  textColor: string;
  accent: string;
  message: React.ReactNode;
  cta: string;
  ctaHref: string;
}

/** "18th December" as "the 18th of December", for the banner sentence. */
function theDayOf(label: string): string {
  const [day, month] = label.split(" ");
  return month ? `the ${day} of ${month}` : label;
}

function christmasMessage(closing: string | null, custom?: string) {
  // Wording staff wrote in the admin replaces the built-in sentence.
  if (custom) return <strong className="font-semibold">{custom}</strong>;
  return (
    <>
      Christmas pre-orders are now open!{" "}
      {closing ? (
        <strong className="font-semibold">Please pre-order through the shop before {theDayOf(closing)}.</strong>
      ) : (
        "Reserve your festive feast."
      )}
    </>
  );
}

const banners: Record<string, BannerConfig> = {
  christmas: {
    icon: <Snowflake className="h-4 w-4" />,
    bg: "bg-lobster",
    textColor: "text-white",
    accent: "text-white",
    message: christmasMessage(null),
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
  // The Christmas banner only shows while Christmas ordering is switched on (same flag the shop
  // uses - /api/feature-flags/christmas). It renders nothing until that answer arrives, so it never
  // flashes up on pages when Christmas is off.
  const [christmasActive, setChristmasActive] = useState(false);
  // Christmas break (after 17th December until the new year): the whole shop is closed to online
  // orders, so this banner switches to a closure notice with the reason, and can't be dismissed.
  const [ordersClosed, setOrdersClosed] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [reopen, setReopen] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [closedTemplate, setClosedTemplate] = useState("");
  const config = banners[variant] || banners.christmas;

  useEffect(() => {
    if (variant !== "christmas") return;
    let cancelled = false;
    fetch("/api/feature-flags/christmas")
      .then((res) => (res.ok ? res.json() : { active: false }))
      .then((data) => {
        if (cancelled) return;
        setChristmasActive(data.active === true);
        setOrdersClosed(data.ordersClosed === true);
        setClosing(typeof data.closingLabel === "string" ? data.closingLabel : null);
        setReopen(typeof data.reopenLabel === "string" ? data.reopenLabel : null);
        setCustom(typeof data.bannerText === "string" ? data.bannerText : "");
        setClosedTemplate(typeof data.closedMessage === "string" ? data.closedMessage : "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const needsFlag = variant === "christmas";

  if (needsFlag && ordersClosed) {
    return (
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2.5 text-center text-xs md:text-sm">
          <Info className="h-4 w-4 shrink-0" />
          <span>{ordersClosedReason(reopen, closedTemplate)}</span>
        </div>
      </div>
    );
  }

  if (!visible || (needsFlag && !christmasActive)) return null;

  return (
    <div className={`relative ${config.bg} ${config.textColor}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-2.5">
        <div className="flex items-center gap-2 text-center text-xs md:text-sm">
          <span className={config.accent}>{config.icon}</span>
          <span>
            {message || (variant === "christmas" ? christmasMessage(closing, custom) : config.message)}{" "}
            <Link
              href={config.ctaHref}
              className={`inline-block underline underline-offset-2 transition-opacity hover:opacity-80 ${config.accent}`}
            >
              {config.cta}
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
