/**
 * Christmas and New Year opening hours, as supplied by the shop for 2026 to 2027 (the PDF sent on 19 November).
 * These are fixed to this year's dates: update the rows each Christmas.
 */
const ROWS: { day: string; hours: string; closed?: boolean; early?: boolean }[] = [
  { day: "Tuesday 15th to Saturday 19th December", hours: "Opening hours as usual" },
  { day: "Sunday 20th", hours: "Closed", closed: true },
  { day: "Monday 21st", hours: "8am to 7pm" },
  { day: "Tuesday 22nd", hours: "8am to 7pm" },
  { day: "Wednesday 23rd", hours: "7am to 7pm" },
  { day: "Thursday 24th (Christmas Eve)", hours: "7am to 2pm", early: true },
  { day: "Christmas Day", hours: "Closed", closed: true },
  { day: "Boxing Day", hours: "Closed", closed: true },
  { day: "Sunday 27th", hours: "Closed", closed: true },
  { day: "Monday 28th", hours: "Closed", closed: true },
  { day: "Tuesday 29th", hours: "Closed", closed: true },
  { day: "Wednesday 30th", hours: "8am to 7pm" },
  { day: "Thursday 31st", hours: "7am to 3pm" },
  { day: "New Year's Day", hours: "Closed", closed: true },
  { day: "Saturday 2nd January", hours: "Closed", closed: true },
];

/** The shop's opening days and times over Christmas and the New Year. */
export default function ChristmasOpeningHours() {
  return (
    <div className="border border-border bg-card p-6 md:p-8" style={{ borderRadius: "5px" }}>
      <h3 className="font-serif text-2xl font-bold text-navy">Opening hours, Christmas and New Year</h3>
      <dl className="mt-5 divide-y divide-border text-sm">
        {ROWS.map((row) => (
          <div key={row.day} className="flex items-baseline justify-between gap-4 py-2">
            <dt className={row.early ? "font-bold text-navy" : "text-navy"}>{row.day}</dt>
            <dd className={row.closed ? "text-text-light" : row.early ? "font-bold text-lobster" : "font-medium text-navy"}>{row.hours}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-text-light">
        We close early on Christmas Eve, at 2pm. Normal opening hours resume in the New Year.
      </p>
    </div>
  );
}
