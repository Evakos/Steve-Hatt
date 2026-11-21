import { USUAL_CLOSING, formatClock, occasionName, type OpeningHours } from "@/lib/opening-hours";

const weekdayName = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" });
const monthShort = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" });
const atNoon = (key: string) => new Date(`${key}T12:00:00Z`);

/**
 * The shop's opening hours over Christmas and the New Year: one card for every date. Every card is solid, with a coloured top
 * edge that shows its kind at a glance: teal for open, coral for closing early, grey for closed. Drawn from the opening hours
 * set in the admin under Messages and hours, the same data that decides which dates can be booked and which collection hours
 * are shown, so it can't disagree with checkout.
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
          const tone = day.closed
            ? "border-[#d6cdbd] border-t-[#b9ad98] bg-[#e6dfd3]"
            : early
              ? "border-lobster/30 border-t-lobster bg-[#fef0ec]"
              : "border-border border-t-teal bg-white";
          return (
            <li key={day.date} className={`flex min-h-[10.5rem] flex-col border border-t-[3px] p-5 ${tone}`} style={{ borderRadius: "5px" }}>
              <div className="flex items-start justify-between">
                <span className={`font-serif text-3xl leading-none font-light ${day.closed ? "text-text-light/50" : "text-lobster/60"}`}>
                  {day.date.slice(8)}
                </span>
                <span className="text-xs tracking-wide text-text-light uppercase">{monthShort.format(atNoon(day.date))}</span>
              </div>

              <h4 className={`mt-3 font-serif text-lg font-semibold ${day.closed ? "text-text-light" : "text-navy"}`}>{weekdayName.format(atNoon(day.date))}</h4>
              {occasion && <p className="mt-0.5 text-xs font-medium text-lobster">{occasion}</p>}

              <div className="mt-auto border-t border-black/10 pt-3">
                {day.closed ? (
                  <p className="text-xs font-medium tracking-widest text-text-light uppercase">Closed</p>
                ) : (
                  <>
                    <p className={`text-sm font-bold ${early ? "text-lobster" : "text-navy"}`}>
                      {formatClock(day.opens)} to {formatClock(day.closes)}
                    </p>
                    {early && <p className="mt-0.5 text-xs font-medium text-navy">We close early</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {hours.footnote && <p className="mt-4 text-xs leading-relaxed text-text-light">{hours.footnote}</p>}
    </div>
  );
}
