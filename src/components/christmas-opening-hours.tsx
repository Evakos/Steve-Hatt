import type { OpeningHours } from "@/lib/site-settings";

/** The shop's opening days and times over Christmas and the New Year. */
export default function ChristmasOpeningHours({ hours }: { hours: OpeningHours }) {
  if (hours.rows.length === 0) return null;
  return (
    <div className="border border-border bg-card p-6 md:p-8" style={{ borderRadius: "5px" }}>
      <h3 className="font-serif text-2xl font-bold text-navy">{hours.title || "Opening hours"}</h3>
      <dl className="mt-5 divide-y divide-border text-sm">
        {hours.rows.map((row) => (
          <div key={row.day} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-navy">{row.day}</dt>
            <dd className={/^closed/i.test(row.hours.trim()) ? "text-text-light" : "font-medium text-navy"}>{row.hours}</dd>
          </div>
        ))}
      </dl>
      {hours.footnote && <p className="mt-4 text-xs leading-relaxed text-text-light">{hours.footnote}</p>}
    </div>
  );
}
