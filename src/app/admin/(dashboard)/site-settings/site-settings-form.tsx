"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Settings {
  notificationEmails: string[];
  bannerText: string;
  closedMessage: string;
  dayNotes: { date: string; note: string }[];
  openingHours: { title: string; rows: { day: string; hours: string }[]; footnote: string };
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
  const [rows, setRows] = useState(initial.openingHours.rows);
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
          openingHours: { title: title.trim(), rows: rows.filter((r) => r.day.trim()), footnote: footnote.trim() },
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
        <p className={label}>Opening hours table</p>
        <p className={hint}>Shown in the Christmas section of the home page. Leave it with no rows to hide it. Update it for next Christmas.</p>
        <label className="mt-3 block text-xs text-text-light" htmlFor="hours-title">Heading</label>
        <input id="hours-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className={`${input} mt-1`} style={{ borderRadius: "6px" }} />
        <ul className="mt-3 space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={r.day}
                onChange={(e) => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))}
                maxLength={80}
                placeholder="Monday 21st"
                className={`${input} min-w-0 flex-[3]`}
                style={{ borderRadius: "6px" }}
                aria-label="Day"
              />
              <input
                value={r.hours}
                onChange={(e) => setRows((prev) => prev.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)))}
                maxLength={60}
                placeholder="8am to 7pm, or Closed"
                className={`${input} min-w-0 flex-[2]`}
                style={{ borderRadius: "6px" }}
                aria-label="Hours"
              />
              <button type="button" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-text-light hover:text-red-600" aria-label="Remove row">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setRows((prev) => [...prev, { day: "", hours: "" }])} className="mt-3 flex items-center gap-1 text-sm font-medium text-navy underline">
          <Plus className="h-4 w-4" /> Add a row
        </button>
        <label className="mt-4 block text-xs text-text-light" htmlFor="hours-foot">Note under the table</label>
        <textarea id="hours-foot" rows={2} value={footnote} onChange={(e) => setFootnote(e.target.value)} maxLength={300} className={`${input} mt-1`} style={{ borderRadius: "6px" }} />
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
