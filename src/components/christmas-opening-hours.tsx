import { USUAL_CLOSING, closedName, formatClock, type OpeningHours } from "@/lib/opening-hours";

const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const atNoon = (key: string) => new Date(`${key}T12:00:00Z`);

/**
 * The shop's opening days and times over Christmas and the New Year, drawn from the opening hours set in the admin under
 * Messages and hours: one card per open day in the same style as the "How a Christmas order works" cards, and one card
 * listing the closed days. The same hours decide which dates can be booked, so this card can't disagree with checkout.
 */
export default function ChristmasOpeningHours({ hours }: { hours: OpeningHours }) {
  const open = hours.days.filter((d) => !d.closed);
  const closed = hours.days.filter((d) => d.closed);
  if (open.length === 0 && closed.length === 0) return null;

  return (
    <div>
      <h3 className="font-serif text-3xl font-bold text-navy">{hours.title || "Opening hours"}</h3>
      {hours.intro && <p className="mt-3 text-base text-text-light">{hours.intro}</p>}

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {open.map((day) => {
          const early = day.closes < USUAL_CLOSING;
          return (
            <li
              key={day.date}
              className={`h-full border p-6 md:min-h-[10rem] ${early ? "border-lobster/40 bg-lobster-light" : "border-border bg-card"}`}
              style={{ borderRadius: "5px" }}
            >
              <span className="font-serif text-2xl font-light text-lobster/40">{day.date.slice(8)}</span>
              <h4 className="mt-3 font-serif text-base font-semibold text-navy">{weekday.format(atNoon(day.date))}</h4>
              <p className={`mt-2 text-sm leading-relaxed ${early ? "font-bold text-lobster" : "text-text-light"}`}>
                {formatClock(day.opens)} to {formatClock(day.closes)}
              </p>
              {early && <p className="mt-1 text-xs font-medium text-navy">We close early</p>}
            </li>
          );
        })}

        {closed.length > 0 && (
          <li className="h-full border border-border bg-card p-6 md:min-h-[10rem]" style={{ borderRadius: "5px" }}>
            <span className="font-serif text-2xl font-light text-lobster/40">&times;</span>
            <h4 className="mt-3 font-serif text-base font-semibold text-navy">Closed</h4>
            <p className="mt-2 text-sm leading-relaxed text-text-light">{closed.map((d) => closedName(d.date)).join(", ")}</p>
          </li>
        )}
      </ol>

      {hours.footnote && <p className="mt-4 text-xs leading-relaxed text-text-light">{hours.footnote}</p>}
    </div>
  );
}
