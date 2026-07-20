import SyncProductsPanel from "./sync-products-panel";

export default function AdminProductsPage() {
  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-navy">Sync products from Google Sheet</h1>
      <p className="mt-1 text-sm text-text-light">
        Pulls the &quot;Products&quot; tab of the shared spreadsheet and updates each product&apos;s title, price,
        publish status, description, preparation options, origin, sustainability and storage text on the
        live site.
      </p>

      <SyncProductsPanel />
    </>
  );
}
