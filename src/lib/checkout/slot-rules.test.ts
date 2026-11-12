import { describe, it, expect } from "vitest";
import { checkBookedSlot, christmasExclusionReason, isChristmasSlotDate } from "./slot-rules";

// Thursday 12 November 2026. The checkout then offers Tue-Sat from Fri 13 Nov to Thu 3 Dec, plus
// the Christmas dates that are Tue-Sat: Tue 22, Wed 23 and Thu 24 December (the 20th is a Sunday).
const NOW = new Date("2026-11-12T10:00:00Z");
const day = (iso: string) => `${iso}T12:00:00.000Z`;

describe("isChristmasSlotDate", () => {
  it("is true only for 20th-24th December", () => {
    expect(isChristmasSlotDate(day("2026-12-22"))).toBe(true);
    expect(isChristmasSlotDate(day("2026-12-24"))).toBe(true);
    expect(isChristmasSlotDate(day("2026-12-19"))).toBe(false);
    expect(isChristmasSlotDate(day("2026-12-25"))).toBe(false);
    expect(isChristmasSlotDate(day("2026-11-22"))).toBe(false);
  });

  it("is false for something that is not a date", () => {
    expect(isChristmasSlotDate("not a date")).toBe(false);
  });
});

describe("checkBookedSlot", () => {
  it("accepts a normal day and says it is not a Christmas order", () => {
    // Friday 20 November
    expect(checkBookedSlot(day("2026-11-20"), { christmasShopActive: true, now: NOW })).toEqual({ ok: true, isChristmas: false });
  });

  it("accepts a Christmas date and says it is a Christmas order", () => {
    expect(checkBookedSlot(day("2026-12-22"), { christmasShopActive: true, now: NOW })).toEqual({ ok: true, isChristmas: true });
  });

  it("refuses a Christmas date while the Christmas shop is off", () => {
    expect(checkBookedSlot(day("2026-12-22"), { christmasShopActive: false, now: NOW }).ok).toBe(false);
  });

  it("refuses days the shop is closed or that are out of range", () => {
    const options = { christmasShopActive: true, now: NOW };
    expect(checkBookedSlot(day("2026-11-16"), options).ok).toBe(false); // Monday
    expect(checkBookedSlot(day("2026-12-20"), options).ok).toBe(false); // Sunday, even though it is the 20th
    expect(checkBookedSlot(day("2026-11-10"), options).ok).toBe(false); // in the past
    expect(checkBookedSlot(day("2026-12-10"), options).ok).toBe(false); // beyond the 21 days
    expect(checkBookedSlot(day("2026-12-25"), options).ok).toBe(false); // Christmas break
    expect(checkBookedSlot("not a date", options).ok).toBe(false);
  });
});

describe("christmasExclusionReason", () => {
  const items = [
    { productName: "Lobster", excludedFromChristmas: true },
    { productName: "Salmon", excludedFromChristmas: false },
  ] as never;

  it("names the excluded product on a Christmas order", () => {
    expect(christmasExclusionReason({ isChristmas: true, lineItems: items })).toContain("Lobster");
  });

  it("says nothing on a normal order", () => {
    expect(christmasExclusionReason({ isChristmas: false, lineItems: items })).toBeNull();
  });
});
