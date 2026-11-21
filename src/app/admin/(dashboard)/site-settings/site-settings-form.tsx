"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface OpeningDay {
  date: string;
  closed: boolean;
  opens: string;
  closes: string;
}

interface Settings {
  notificationEmails: string[];
  bannerText: string;
  closedMessage: string;
  dayNotes: { date: string; note: string }[];
  openingHours: { title: string; intro: string; footnote: string; days: OpeningDay[] };
}

const card = "mt-4 border border-border bg-cream p-5";
const input = "w-full border border-border bg-white px-3 py-2 text-sm text-navy";
const label = "block text-sm font-medium text-navy";
const hint = "mt-1 text-xs text-text-light";

export default function SiteSettingsForm({ initial }: { initial: Settings }) {
  const [emails, setEmails] = useState(initial.notificationEmails.join("\n"));
  const [bannerText, setBannerText] = useState(initial.bannerText);
  const [closedMessage, setClosedMessage] = useState(initial.closedMessage);
  const [dayNotes, setDayNotes] = useState(initial.dayNotes);
  const [title, setTitle] = useState(initial.openingHours.title);
  const [intro, setIntro] = useState(initial.openingHours.intro);
  const [days, setDays] = useState<OpeningDay[]>(initial.openingHours.days);
  const [footnote, setFootnote] = useState(initial.openingHours.footnote);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationEmails: emails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean),
          bannerText: bannerText.trim(),
          closedMessage: closedMessage.trim(),
          dayNotes: dayNotes.filter((n) => n.date && n.note.trim()),
          openingHours: {
            title: title.trim(),
            intro: intro.trim(),
            footnote: footnote.trim(),
            days: days.filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error === "Invalid request" ? "Something doesn't look right. Check the email addresses and that no box is too long." : data.error ?? "Save failed" });
        return;
      }
      setMessage({ ok: true, text: "Saved, and live on the website now." });
    } catch {
      setMessage({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className={card} style={{ borderRadius: "14px" }}>
        <label className={label} htmlFor="emails">Order emails go to</label>
        <textarea id="emails" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} className={`${input} mt-2`} style={{ borderRadius: "6px" }} />
        <p className={hint}>One address per line. New-order alerts and messages from the contact form are sent to every address.</p>
      </div>

      <div className={card} style={{ borderRadius: "14px" }}>
        <label className={label} htmlFor="banner">Christmas banner</label>
        <input id="banner" value={bannerText} onChange={(e) => setBannerText(e.target.value)} maxLength={200} className={`${input} mt-2`} style={{ borderRadius: "6px" }} />
        <p className={hint}>
          The sentence in the bar at the top of the site while Christmas ordering is on. Leave blank for: &quot;Please pre-order through
          the shop before the 18th of December.&quot; (the date comes from the last order day).
        </p>

        <label className={`${label} mt-5`} htmlFor="closed">Shop closed message</label>
        <textarea id="closed" rows={3} value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)} maxLength={400} className={`${input} mt-2`} style={{ borderRadius: "6px" }} />
        <p className={hint}>
          Shown in the banner and at checkout while the shop is closed. Write <code>{"{reopen}"}</code> where the reopening day should go. Leave blank for:
          &quot;The shop will be closed until {"{reopen}"}. During this period orders cannot be made due to staff holidays and fish supplies.&quot;
        </p>
      </div>

      <div className={card} style={{ borderRadius: "14px" }}>
        <p className={label}>Notes on particular dates</p>
        <p className={hint}>
          A note attached to every order booked for that date: shown in bold in the customer and staff emails, on the order, and beside
          the date at checkout. For example an early closing time on Christmas Eve.
        </p>
        <ul className="mt-3 space-y-2">
          {dayNotes.map((n, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={n.date}
                onChange={(e) => setDayNotes((prev) => prev.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                className={`${input} w-auto`}
                style={{ borderRadius: "6px" }}
                aria-label="Date"
              />
              <input
                value={n.note}
                onChange={(e) => setDayNotes((prev) => prev.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                maxLength={200}
                placeholder="Please note: we close early on Christmas Eve, at 2pm."
                className={`${input} min-w-0 flex-1`}
                style={{ borderRadius: "6px" }}
                aria-label="Note"
              />
              <button type="button" onClick={() => setDayNotes((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-text-light hover:text-red-600" aria-label="Remove note">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setDayNotes((prev) => [...prev, { date: "", note: "" }])} className="mt-3 flex items-center gap-1 text-sm font-medium text-navy underline">
          <Plus className="h-4 w-4" /> Add a note
        </button>
      </div>

      <div className={card} style={{ borderRadius: "14px" }}>
        <p className={label}>Opening hours by date</p>
        <p className={hint}>
          The single source for the shop&apos;s hours. It draws the opening hours cards on the home page, and the same days decide
          what customers can book: a <strong>closed</strong> day is never offered, collection shows that day&apos;s real hours, and
          a day that closes before 5pm adds an early-closing note to its orders automatically. A day that isn&apos;t listed here
          keeps the usual hours.
        </p>
        <label className="mt-3 block text-xs text-text-light" htmlFor="hours-title">Heading</label>
        <input id="hours-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className={`${input} mt-1`} style={{ borderRadius: "6px" }} />
        <label className="mt-3 block text-xs text-text-light" htmlFor="hours-intro">Line under the heading</label>
        <input id="hours-intro" value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={200} placeholder="Tuesday 15th to Saturday 19th December: opening hours as usual" className={`${input} mt-1`} style={{ borderRadius: "6px" }} />

        <ul className="mt-4 space-y-2">
          {days.map((d, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={d.date}
                onChange={(e) => setDays((prev) => prev.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                className={`${input} w-auto`}
                style={{ borderRadius: "6px" }}
                aria-label="Date"
              />
              <label className="flex items-center gap-1.5 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={d.closed}
                  onChange={(e) => setDays((prev) => prev.map((x, j) => (j === i ? { ...x, closed: e.target.checked } : x)))}
                  className="h-4 w-4 accent-navy"
                />
                Closed
              </label>
              <input
                type="time"
                value={d.opens}
                disabled={d.closed}
                onChange={(e) => setDays((prev) => prev.map((x, j) => (j === i ? { ...x, opens: e.target.value } : x)))}
                className={`${input} w-auto disabled:opacity-40`}
                style={{ borderRadius: "6px" }}
                aria-label="Opens"
              />
              <span className="text-sm text-text-light">to</span>
              <input
                type="time"
                value={d.closes}
                disabled={d.closed}
                onChange={(e) => setDays((prev) => prev.map((x, j) => (j === i ? { ...x, closes: e.target.value } : x)))}
                className={`${input} w-auto disabled:opacity-40`}
                style={{ borderRadius: "6px" }}
                aria-label="Closes"
              />
              <button type="button" onClick={() => setDays((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-text-light hover:text-red-600" aria-label="Remove day">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setDays((prev) => [...prev, { date: "", closed: false, opens: "09:00", closes: "17:00" }])}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-navy underline"
        >
          <Plus className="h-4 w-4" /> Add a day
        </button>
        <label className="mt-4 block text-xs text-text-light" htmlFor="hours-foot">Note under the cards</label>
        <textarea id="hours-foot" rows={2} value={footnote} onChange={(e) => setFootnote(e.target.value)} maxLength={300} className={`${input} mt-1`} style={{ borderRadius: "6px" }} />
      </div>

      <div className={card} style={{ borderRadius: "14px" }}>
        <p className={label}>Preview the closed shop</p>
        <p className={hint}>
          See what customers see while the shop is closed for orders: the banner, the pop-up on the home page, Add to basket switched off
          and the checkout message. It only changes what <strong>you</strong> see, in this browser, for 20 minutes, and nothing changes on the
          live shop. A bar at the bottom of the page lets you exit. Save any changes above first, as the preview uses the saved wording.
        </p>
        <a
          href="/admin/preview-closed"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-block border border-navy px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-white"
          style={{ borderRadius: "6px" }}
        >
          Preview the closed shop
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-lobster px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lobster/90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: "6px" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-teal" : "text-red-600"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
