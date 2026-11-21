import type { OpeningHours } from "@/lib/site-settings";

const isClosed = (hours: string) => /^closed/i.test(hours.trim());
const isEarlyClose = (day: string) => /christmas eve/i.test(day);

/**
 * The shop's opening days and times over Christmas and the New Year, edited in the admin under Messages and hours.
 * A first row such as "Opening hours as usual" becomes a banner across the top, and the other days split into two columns.
 */
export default function ChristmasOpeningHours({ hours }: { hours: OpeningHours }) {
  if (hours.rows.length === 0) return null;

  // A first row that carries no times (just says hours are as usual) reads best as an intro banner.
  const [first, ...rest] = hours.rows;
  const hasIntro = /as usual/i.test(first.hours);
  const days = hasIntro ? rest : hours.rows;
  const half = Math.ceil(days.length / 2);
  const columns = [days.slice(0, half), days.slice(half)];

  return (
    <div className="border border-border bg-card p-6 md:p-8" style={{ borderRadius: "14px" }}>
      <h3 className="text-center font-serif text-2xl font-bold text-navy">{hours.title || "Opening hours"}</h3>

      {hasIntro && (
        <p className="mx-auto mt-5 max-w-fit bg-sand px-4 py-2 text-center text-sm text-navy" style={{ borderRadius: "999px" }}>
          <span className="font-medium">{first.day}:</span> {first.hours.toLowerCase()}
        </p>
      )}

      <div className="mt-6 grid gap-x-12 md:grid-cols-2">
        {columns.map((rows, c) => (
          <dl key={c} className="text-sm">
            {rows.map((row) => {
              const closed = isClosed(row.hours);
              const early = isEarlyClose(row.day) && !closed;
              return (
                <div
                  key={row.day}
                  className={`flex items-baseline justify-between gap-4 border-b border-border/70 py-2.5 ${early ? "bg-lobster-light px-3 -mx-3" : ""}`}
                  style={early ? { borderRadius: "6px" } : undefined}
                >
                  <dt className={early ? "font-medium text-navy" : closed ? "text-text-light" : "text-navy"}>{row.day}</dt>
                  <dd
                    className={
                      closed
                        ? "text-xs tracking-wide text-text-light uppercase"
                        : early
                          ? "font-bold text-lobster"
                          : "font-semibold text-navy"
                    }
                  >
                    {row.hours}
                  </dd>
                </div>
              );
            })}
          </dl>
        ))}
      </div>

      {hours.footnote && (
        <p className="mt-6 border-t border-border pt-4 text-center text-xs leading-relaxed text-text-light">{hours.footnote}</p>
      )}
    </div>
  );
}
