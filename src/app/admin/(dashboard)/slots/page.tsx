import { getDisabledSlots } from "@/lib/feature-flags";
import { isChristmasFulfilmentDate } from "@/lib/christmas-dates";
import { getAvailableDates, slotDateKey } from "@/lib/slots";
import SlotsGrid from "./slots-grid";

// About five months ahead, which runs into next year and past Easter, so closures can be set up
// well in advance. Customers can still only book about three weeks ahead.
const ADMIN_DAYS_AHEAD = 150;

export default async function AdminSlotsPage() {
  const disabled = await getDisabledSlots();
  const dates = getAvailableDates(new Date(), ADMIN_DAYS_AHEAD).map((d) => ({
    key: slotDateKey(d),
    label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/London" }),
    month: d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" }),
    isChristmas: isChristmasFulfilmentDate(d),
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Delivery slots</h1>
      <p className="mt-1 max-w-3xl text-sm text-text-light">
        Every day customers can book is listed below, about five months ahead, with its three time slots. Switch a slot off
        and customers can no longer choose it at checkout. It takes effect straight away, with no redeploy. Everything is
        on unless you switch it off. Sundays, Mondays and the Christmas break (25th December to 3rd January) are never
        offered, so they are not listed. Customers can only book about three weeks ahead, so switching a later day off
        simply closes it in advance.
      </p>
      <SlotsGrid dates={dates} initialDisabled={disabled} />
    </div>
  );
}
