import "server-only";
import { get } from "@vercel/edge-config";
import { getServerEnv } from "@/lib/env";

/**
 * Wording and hours the shop edits in the admin (Messages and hours), stored in Vercel's settings store like the
 * other admin settings. Anything left unset falls back to the built-in wording, so the site never shows nothing.
 */
export interface DayNote {
  /** YYYY-MM-DD: orders booked for this date carry the note. */
  date: string;
  note: string;
}
export interface OpeningHoursRow {
  day: string;
  hours: string;
}
export interface OpeningHours {
  title: string;
  rows: OpeningHoursRow[];
  footnote: string;
}
export interface SiteSettings {
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

/** The opening hours table shown on the homepage. No rows means it isn't shown. */
export async function getOpeningHours(): Promise<OpeningHours> {
  const value = (await read("openingHours")) as Partial<OpeningHours> | undefined;
  const rows = Array.isArray(value?.rows)
    ? value.rows.filter((r): r is OpeningHoursRow => !!r && typeof r.day === "string" && typeof r.hours === "string" && r.day.trim() !== "")
    : [];
  return { title: text(value?.title), rows, footnote: text(value?.footnote) };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [notificationEmails, bannerText, closedMessage, dayNotes, openingHours] = await Promise.all([
    getNotificationEmails(),
    getBannerText(),
    getClosedMessage(),
    getDayNotes(),
    getOpeningHours(),
  ]);
  return { notificationEmails, bannerText, closedMessage, dayNotes, openingHours };
}
