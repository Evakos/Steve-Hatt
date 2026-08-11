import { describe, it, expect } from "vitest";
import {
  isTueToSat,
  isChristmasFulfilmentDate,
  getUpcomingChristmasDates,
  hasUpcomingChristmasDates,
} from "./christmas-dates";

describe("isTueToSat", () => {
  it("accepts Tuesday through Saturday", () => {
    expect(isTueToSat(new Date(2026, 7, 11))).toBe(true); // Tue 11 Aug 2026
    expect(isTueToSat(new Date(2026, 7, 15))).toBe(true); // Sat 15 Aug 2026
  });

  it("rejects Sunday and Monday", () => {
    expect(isTueToSat(new Date(2026, 7, 16))).toBe(false); // Sun 16 Aug 2026
    expect(isTueToSat(new Date(2026, 7, 17))).toBe(false); // Mon 17 Aug 2026
  });
});

describe("isChristmasFulfilmentDate", () => {
  it("accepts 20th–24th December", () => {
    expect(isChristmasFulfilmentDate(new Date(2026, 11, 20))).toBe(true);
    expect(isChristmasFulfilmentDate(new Date(2026, 11, 24))).toBe(true);
  });

  it("rejects dates outside the Christmas window", () => {
    expect(isChristmasFulfilmentDate(new Date(2026, 11, 19))).toBe(false);
    expect(isChristmasFulfilmentDate(new Date(2026, 11, 25))).toBe(false);
    expect(isChristmasFulfilmentDate(new Date(2026, 10, 20))).toBe(false); // 20th Nov
  });
});

describe("getUpcomingChristmasDates", () => {
  it("returns the current year's Tue–Sat fulfilment dates whenever they're still to come", () => {
    // Aug 2026: Dec 20 = Sun, 21 = Mon, 22 = Tue, 23 = Wed, 24 = Thu.
    const summer = getUpcomingChristmasDates(new Date(2026, 7, 11));
    expect(summer.map((d) => d.getDate())).toEqual([22, 23, 24]);
  });

  it("returns the same window during the late-autumn season", () => {
    const oct = getUpcomingChristmasDates(new Date(2026, 9, 31));
    expect(oct.map((d) => d.getDate())).toEqual([22, 23, 24]);
    const nov = getUpcomingChristmasDates(new Date(2026, 10, 1));
    expect(nov.map((d) => d.getDate())).toEqual([22, 23, 24]);
  });

  it("excludes dates already passed mid-December", () => {
    // 19th Dec 2026 is a Saturday — Dec 22/23/24 are still to come.
    const dates = getUpcomingChristmasDates(new Date(2026, 11, 19));
    expect(dates.map((d) => d.getDate())).toEqual([22, 23, 24]);
  });

  it("returns nothing on and after Christmas Eve itself", () => {
    expect(getUpcomingChristmasDates(new Date(2026, 11, 24))).toHaveLength(0);
    expect(getUpcomingChristmasDates(new Date(2026, 11, 25))).toHaveLength(0);
  });

  it("rolls over to next year once this December's window has passed", () => {
    const jan = getUpcomingChristmasDates(new Date(2027, 0, 5));
    expect(jan.length).toBeGreaterThan(0);
    expect(jan.every((d) => d.getFullYear() === 2027)).toBe(true);
  });
});

describe("hasUpcomingChristmasDates", () => {
  it("is true year-round while the current window is ahead, false once it closes", () => {
    expect(hasUpcomingChristmasDates(new Date(2026, 7, 11))).toBe(true); // August
    expect(hasUpcomingChristmasDates(new Date(2026, 10, 1))).toBe(true); // November
    expect(hasUpcomingChristmasDates(new Date(2026, 11, 24))).toBe(false); // Christmas Eve
  });
});
