import { USUAL_CLOSING, formatClock, occasionName, type OpeningHours } from "@/lib/opening-hours";

const dayTitle = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const atNoon = (key: string) => new Date(`${key}T12:00:00Z`);

/**
 * The shop's opening hours over Christmas and the New Year: one card for every date, in the same style as the
 * "How a Christmas order works" cards. Drawn from the opening hours set in the admin under Messages and hours, the same
 * data that decides which dates can be booked and which collection hours are shown, so it can't disagree with checkout.
 */
export default function ChristmasOpeningHours({ hours }: { hours: OpeningHours }) {
  if (hours.days.length === 0) return null;

  return (
    <div>
      <h3 className="font-serif text-3xl font-bold text-navy">{hours.title || "Opening hours"}</h3>
      {hours.intro && <p className="mt-3 text-base text-text-light">{hours.intro}</p>}

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {hours.days.map((day) => {
          const early = !day.closed && day.closes < USUAL_CLOSING;
          const occasion = occasionName(day.date);
          return (
            <li
              key={day.date}
              className={`h-full border p-5 md:min-h-[9.5rem] ${
                early ? "border-lobster/40 bg-lobster-light" : day.closed ? "border-border bg-sand/50" : "border-border bg-card"
              }`}
              style={{ borderRadius: "5px" }}
            >
              <span className={`font-serif text-2xl font-light ${day.closed ? "text-text-light/40" : "text-lobster/40"}`}>{day.date.slice(8)}</span>
              <h4 className={`mt-3 font-serif text-base font-semibold ${day.closed ? "text-text-light" : "text-navy"}`}>
                {dayTitle.format(atNoon(day.date))}
              </h4>
              {occasion && <p className="text-xs font-medium text-lobster">{occasion}</p>}
              {day.closed ? (
                <p className="mt-2 text-xs tracking-wide text-text-light uppercase">Closed</p>
              ) : (
                <p className={`mt-2 text-sm leading-relaxed ${early ? "font-bold text-lobster" : "text-text-light"}`}>
                  {formatClock(day.opens)} to {formatClock(day.closes)}
                </p>
              )}
              {early && <p className="mt-1 text-xs font-medium text-navy">We close early</p>}
            </li>
          );
        })}
      </ol>

      {hours.footnote && <p className="mt-4 text-xs leading-relaxed text-text-light">{hours.footnote}</p>}
    </div>
  );
}
