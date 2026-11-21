import { getSiteSettings } from "@/lib/site-settings";
import SiteSettingsForm from "./site-settings-form";

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl font-bold text-navy">Messages and hours</h1>
      <p className="mt-1 max-w-3xl text-sm text-text-light">
        The wording customers see, notes added to particular dates, the opening hours table, and who receives order
        emails. Leave a message blank to use the shop&apos;s built-in wording. Changes show on the site straight away.
      </p>
      <SiteSettingsForm initial={settings} />
    </div>
  );
}
