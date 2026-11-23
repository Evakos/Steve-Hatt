import "server-only";
import { get } from "@vercel/edge-config";
import { getServerEnv } from "@/lib/env";
import type { OpeningDay, OpeningHours } from "@/lib/opening-hours";

export type { OpeningDay, OpeningHours };

/**
 * Wording and hours the shop edits in the admin (Messages and hours), stored in Vercel's settings store like the
 * other admin settings. Anything left unset falls back to the built-in wording, so the site never shows nothing.
 */
export interface DayNote {
  /** YYYY-MM-DD: orders booked for this date carry the note. */
  date: string;
  note: string;
}
export interface SiteSettings {
  /** The Test orders switch as saved (mock payments mark orders TEST regardless). */
  testOrderMode: boolean;
  notificationEmails: string[];
  bannerText: string;
  closedMessage: string;
  dayNotes: DayNote[];
  openingHours: OpeningHours;
}

async function read(key: string): Promise<unknown> {
  try {
    return await get(key);
  } catch {
    return undefined;
  }
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Who gets new-order alerts and contact messages: the addresses set in the admin, else ADMIN_NOTIFICATION_EMAIL. */
export async function getNotificationEmails(): Promise<string[]> {
  const value = await read("notificationEmails");
  const list = Array.isArray(value) ? value.filter((e): e is string => typeof e === "string" && e.includes("@")) : [];
  return list.length > 0 ? list : getServerEnv().ADMIN_NOTIFICATION_EMAIL;
}

/** The banner sentence staff wrote, or "" to use the built-in wording. */
export async function getBannerText(): Promise<string> {
  return text(await read("bannerText"));
}

/** The closed-shop message staff wrote ({reopen} becomes the reopening day), or "" for the built-in wording. */
export async function getClosedMessage(): Promise<string> {
  return text(await read("closedMessage"));
}

/** Notes added to orders booked for particular dates, such as an early closing time. */
export async function getDayNotes(): Promise<DayNote[]> {
  const value = await read("dayNotes");
  if (!Array.isArray(value)) return [];
  return value.filter(
    (n): n is DayNote => !!n && typeof n.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(n.date) && typeof n.note === "string" && n.note.trim() !== ""
  );
}

/** The opening hours by date. They decide which dates can be booked, the collection hours shown, and the home page card. */
export async function getOpeningHours(): Promise<OpeningHours> {
  const value = (await read("openingHours")) as Partial<OpeningHours> | undefined;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  const days = Array.isArray(value?.days)
    ? value.days
        .filter((d): d is OpeningDay => !!d && typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
        .map((d) => ({
          date: d.date,
          closed: d.closed === true,
          opens: typeof d.opens === "string" && time.test(d.opens) ? d.opens : "09:00",
          closes: typeof d.closes === "string" && time.test(d.closes) ? d.closes : "17:00",
        }))
        .sort((x, y) => x.date.localeCompare(y.date))
    : [];
  return { title: text(value?.title), intro: text(value?.intro), footnote: text(value?.footnote), days };
}

export async function getOpeningDays(): Promise<OpeningDay[]> {
  return (await getOpeningHours()).days;
}

/** The saved Test orders switch (not counting the mock payments override). */
export async function getTestOrderSetting(): Promise<boolean> {
  try {
    return (await get("testOrderMode")) === true;
  } catch {
    return false;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [notificationEmails, bannerText, closedMessage, dayNotes, openingHours, testOrderMode] = await Promise.all([
    getNotificationEmails(),
    getBannerText(),
    getClosedMessage(),
    getDayNotes(),
    getOpeningHours(),
    getTestOrderSetting(),
  ]);
  return { notificationEmails, bannerText, closedMessage, dayNotes, openingHours, testOrderMode };
}
