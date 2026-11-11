import { getDisabledSlots } from "@/lib/feature-flags";
import { isChristmasFulfilmentDate } from "@/lib/christmas-dates";
import { getAvailableDates, slotDateKey } from "@/lib/slots";
import SlotsGrid from "./slots-grid";

export default async function AdminSlotsPage() {
  const disabled = await getDisabledSlots();
  const dates = getAvailableDates().map((d) => ({
    key: slotDateKey(d),
    label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/London" }),
    isChristmas: isChristmasFulfilmentDate(d),
  }));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Delivery slots</h1>
      <p className="mt-1 max-w-3xl text-sm text-text-light">
        Every day customers can book is listed below, with its three time slots. Switch a slot off and customers can no
        longer choose it at checkout. It takes effect straight away, with no redeploy. Everything is on unless you switch
        it off.
      </p>
      <SlotsGrid dates={dates} initialDisabled={disabled} />
    </div>
  );
}
