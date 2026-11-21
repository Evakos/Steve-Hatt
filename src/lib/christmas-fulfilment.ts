import { getUpcomingChristmasDates } from "./christmas-dates";
import { isDateBookableWithoutWindow, toSlotInstant } from "./slots";

/**
 * What customers can do on the Christmas days, worked out from the settings so the wording on the site can't disagree with
 * checkout: "delivery or collection" while at least one Christmas day still offers delivery, otherwise just "collection".
 * Delivery is switched off per day on the Delivery slots page.
 */
export function christmasFulfilmentPhrase(
  christmasDays: readonly string[],
  disabledSlots: readonly string[],
  from: Date = new Date()
): "delivery or collection" | "collection" {
  const deliveryOffered = getUpcomingChristmasDates(from, christmasDays).some((d) =>
    isDateBookableWithoutWindow(disabledSlots, toSlotInstant(d), "delivery")
  );
  return deliveryOffered ? "delivery or collection" : "collection";
}

/** "18th December" as "the 18th of December", for sentences like "Please pre-order before the 18th of December." */
export function theDayOf(label: string): string {
  const [day, month] = label.split(" ");
  return month ? `the ${day} of ${month}` : label;
}

/** "The last day to pre-order is the 17th of December." One wording everywhere, so "closes on the 17th" can't be misread. */
export function lastDaySentence(lastOrderLabel: string | null): string {
  return lastOrderLabel ? `The last day to pre-order is ${theDayOf(lastOrderLabel)}.` : "";
}
