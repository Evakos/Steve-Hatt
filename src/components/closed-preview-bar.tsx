"use client";

import { useEffect, useState } from "react";

const COOKIE = "sh_preview_closed";

/** Shown only while staff are previewing the closed shop (see /admin/preview-closed), so the preview can't be forgotten. */
export default function ClosedPreviewBar() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(document.cookie.split("; ").some((c) => c === `${COOKIE}=1`));
  }, []);

  if (!on) return null;

  function exit() {
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    window.location.assign("/admin/site-settings");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-navy px-4 py-3 text-sm text-white shadow-lg">
      <span>Previewing the closed shop. Only you can see this, and nothing has changed on the live shop.</span>
      <button type="button" onClick={exit} className="bg-white px-4 py-1.5 text-sm font-medium text-navy hover:bg-cream" style={{ borderRadius: "6px" }}>
        Exit preview
      </button>
    </div>
  );
}
