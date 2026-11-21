import { USUAL_CLOSING, formatClock, type OpeningDay, type OpeningHours } from "@/lib/opening-hours";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar months from the first to the last date in the opening hours. */
function monthsCovered(days: readonly OpeningDay[]): { year: number; month: number }[] {
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const out: { year: number; month: number }[] = [];
  let y = Number(first.slice(0, 4));
  let m = Number(first.slice(5, 7)) - 1;
  const endY = Number(last.slice(0, 4));
  const endM = Number(last.slice(5, 7)) - 1;
  while (y < endY || (y === endY && m <= endM)) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function MonthCalendar({ year, month, byDate }: { year: number; month: number; byDate: Map<string, OpeningDay> }) {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="border border-border bg-card p-4 md:p-5" style={{ borderRadius: "5px" }}>
      <h4 className="font-serif text-lg font-semibold text-navy">
        {MONTH_NAMES[month]} {year}
      </h4>
      <div className="mt-3 grid grid-cols-7 gap-px border border-border bg-border text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-sand/60 py-1.5 text-[10px] font-medium tracking-wide text-text-light uppercase md:text-xs">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="min-h-[4.25rem] bg-sand/30 md:min-h-[5rem]" />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const entry = byDate.get(key);
          const weekday = i % 7; // 0 Monday ... 6 Sunday
          const usualClosed = weekday === 0 || weekday === 6; // the shop's normal week is closed Sunday and Monday
          const closed = entry ? entry.closed : usualClosed;
          const early = !!entry && !entry.closed && entry.closes < USUAL_CLOSING;

          return (
            <div
              key={key}
              className={`min-h-[4.25rem] p-1.5 text-left md:min-h-[5rem] md:p-2 ${early ? "bg-lobster-light" : closed ? "bg-sand/50" : "bg-card"}`}
            >
              <span className={`text-xs font-medium md:text-sm ${closed ? "text-text-light" : "text-navy"}`}>{day}</span>
              {entry && !entry.closed ? (
                <p className={`mt-1 text-[10px] leading-tight md:text-xs ${early ? "font-bold text-lobster" : "font-semibold text-navy"}`}>
                  {formatClock(entry.opens)}-{formatClock(entry.closes)}
                  {early && <span className="mt-0.5 block text-[9px] font-medium text-navy md:text-[10px]">closes early</span>}
                </p>
              ) : closed ? (
                <p className="mt-1 text-[10px] tracking-wide text-text-light uppercase md:text-[11px]">Closed</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The shop's opening hours over Christmas and the New Year as a calendar: every date in the months covered, with the hours on
 * each day that has them and "Closed" on the closed days. Drawn from the opening hours set in the admin under Messages and
 * hours, the same data that decides which dates can be booked, so the calendar can't disagree with checkout. A date with no
 * entry keeps the shop's usual hours (closed Sunday and Monday, open the rest of the week).
 */
export default function ChristmasOpeningHours({ hours }: { hours: OpeningHours }) {
  if (hours.days.length === 0) return null;
  const byDate = new Map(hours.days.map((d) => [d.date, d]));

  return (
    <div>
      <h3 className="font-serif text-3xl font-bold text-navy">{hours.title || "Opening hours"}</h3>
      {hours.intro && <p className="mt-3 text-base text-text-light">{hours.intro}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {monthsCovered(hours.days).map((m) => (
          <MonthCalendar key={`${m.year}-${m.month}`} year={m.year} month={m.month} byDate={byDate} />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-light">
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-border bg-card" /> Open (hours shown, otherwise usual hours)
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-lobster/40 bg-lobster-light" /> Closes early
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-border bg-sand/50" /> Closed
        </li>
      </ul>

      {hours.footnote && <p className="mt-3 text-xs leading-relaxed text-text-light">{hours.footnote}</p>}
    </div>
  );
}
